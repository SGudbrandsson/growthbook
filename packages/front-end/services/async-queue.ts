import cloneDeep from "lodash/cloneDeep";
import uniq from "lodash/uniq";

/**
 * Each task must have an identifier and some optional data that gets passed
 * to the {@link PerformTaskFunc} and {@link OnProgressFunc}
 */
export type QueueTask<DataType> = {
  id: string;
  data: DataType;
};

/**
 * A task result has a status, and in the case where status == success,
 * data that matches the generic argument ResultData
 */
export type TaskResult<ResultData> =
  | {
      status: "success";
      data: ResultData;
    }
  | { status: "fail" }
  | { status: "retry" };

/**
 * The function that performs the task with the provided task data.
 * Use the provided data and return a task result.
 *
 * If the task succeeds, return:
 *    { status: "success", data: <ResultData> }
 *
 * If the task fails and you'd like to retry, return:
 *    { status: "retry" }
 *
 * If the task fails and you do not want to retry, return:
 *    { status: "fail" }
 */
export type PerformTaskFunc<DataType, ResultData> = (
  data: DataType
) => Promise<TaskResult<ResultData>>;

/**
 * For tracking incremental progress and receiving the result.
 * is called with the task result for an individual task.
 * This method will only be called in one of the following conditions:
 *  1. The task completes successfully
 *  2. The task has exhausted its retries and is considered a failure
 */
export type OnProgressFunc<ResultData> = (
  id: string,
  result: TaskResult<ResultData>
) => void;

/**
 * Function options required for performing the async action and receiving the incremental progress results.
 */
export type EnqueueFns<DataType, ResultData> = {
  perform: PerformTaskFunc<DataType, ResultData>;
  onProgress: OnProgressFunc<ResultData>;
};

/**
 * Options for enqueuing
 */
export type EnqueueOptions = {
  intervalDelayMs?: number;
  retryCount?: number;
};

const DEFAULT_INTERVAL_DELAY = 500;
const DEFAULT_RETRY_COUNT = 2;

/**
 * default options when enqueuing new tasks.
 */
const newDefaultEnqueueOptions = (): EnqueueOptions => ({
  intervalDelayMs: DEFAULT_INTERVAL_DELAY,
  retryCount: DEFAULT_RETRY_COUNT,
});

export type QueueResult = {
  completed: string[];
  failed: string[];
};

/**
 * Enqueue tasks with data to be passed to the perform function
 * @param tasks
 * @param performFunc
 * @param onProgress
 * @param options
 * @throws Error when the provided task list is empty or task identifiers are not unique
 */
export async function enqueueTasks<DataType, ResultData>(
  tasks: QueueTask<DataType>[],
  { perform, onProgress }: EnqueueFns<DataType, ResultData>,
  {
    intervalDelayMs = DEFAULT_INTERVAL_DELAY,
    retryCount = DEFAULT_RETRY_COUNT,
  }: EnqueueOptions = newDefaultEnqueueOptions()
): Promise<QueueResult> {
  if (!tasks.length) {
    throw new Error("cannot enqueue empty task list");
  }

  const taskIds = tasks.map((t) => t.id);
  if (tasks.length !== uniq(taskIds).length) {
    throw new Error(
      `all task identifiers must be unique: ${taskIds.join(", ")}`
    );
  }

  // Make a copy of the task list since it will be mutated
  const taskQueue = cloneDeep<QueueTask<DataType>[]>(tasks);

  let currentIndex = 0;
  let currentDelay = 0;

  const completed: string[] = [];
  const failed: string[] = [];
  const retries = new Map<string, number>();

  const handleSuccess = (taskId: string, result: TaskResult<ResultData>) => {
    completed.push(taskId);
    onProgress(taskId, result);
  };

  const handleFailure = (
    task: QueueTask<DataType>,
    result: TaskResult<ResultData>,
    { retry }: { retry: boolean }
  ) => {
    const taskRetryCount = retries.get(task.id) || 0;

    // if the task should not be retried, or the retry count is exhausted, progress as failure
    if (!retry || taskRetryCount >= retryCount) {
      failed.push(task.id);
      onProgress(task.id, result);
    } else {
      // re-enqueue task for retrying
      retries.set(task.id, taskRetryCount + 1);
      taskQueue.push(task);
    }
  };

  while (taskQueue.length) {
    currentDelay = currentDelay + currentIndex * intervalDelayMs;

    const task = taskQueue.shift();
    if (!task) {
      break;
    }

    try {
      const result = await perform(task.data);
      switch (result.status) {
        case "fail":
          handleFailure(task, result, { retry: false });
          break;

        case "success":
          handleSuccess(task.id, result);
          break;

        case "retry":
          handleFailure(task, result, { retry: true });
          break;
      }
    } catch (e) {
      handleFailure(task, { status: "fail" }, { retry: true });
    } finally {
      currentIndex++;
    }
  }

  return {
    completed,
    failed,
  };
}
