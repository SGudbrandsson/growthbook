import React, { FC, FormEvent, ReactNode, useCallback } from "react";
import { FaUpload } from "react-icons/fa";
import { BsCheck, BsX } from "react-icons/bs";
import {
  ImportTaskResults,
  useImportFromLaunchDarkly,
} from "@/components/importing/ImportFromLaunchDarkly/useImportFromLaunchDarkly";
import LoadingSpinner from "@/components/LoadingSpinner";

type ImportFromLaunchDarklyProps = {
  pending: boolean;
  errors: string[];
  results: ImportTaskResults;
  onSubmit(apiToken: string): Promise<void>;
};

export const ImportFromLaunchDarkly: FC<ImportFromLaunchDarklyProps> = ({
  onSubmit,
  errors,
  results,
  pending,
}) => {
  const handleSubmit = useCallback(
    (evt: FormEvent<HTMLFormElement>) => {
      evt.preventDefault();

      const form = evt.currentTarget as HTMLFormElement;
      const apiKey = form.elements["api_token"].value;

      onSubmit(apiKey);
    },
    [onSubmit]
  );

  return (
    <div className="">
      <h1>Import from LaunchDarkly</h1>
      <p>
        Import your data from LaunchDarkly. Just provide a LaunchDarkly API key
        or personal access token to proceed.
      </p>
      <p>
        This task will attempt to import the following resources from
        LaunchDarkly:
      </p>
      <ul>
        <li>Projects</li>
        <li>Environments</li>
        <li>Feature flags</li>
      </ul>

      <form className="mt-4" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="text-muted font-weight-bold" htmlFor="api_token">
            LaunchDarkly API token
          </label>
          <input
            className="form-control"
            style={{ maxWidth: 400 }}
            type="text"
            name="api_token"
            id="api_token"
          />
        </div>
        <button className="btn btn-primary" type="submit">
          <FaUpload /> Start Import
        </button>
      </form>

      {/* General errors */}
      {errors.length > 0 && (
        <div className="my-4">
          {errors.map((error) => (
            <div className="alert alert-danger" key={error}>
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Loading spinner for pending state */}
      {pending && (
        <div className="my-4 d-sm-flex justify-content-center">
          <LoadingSpinner />
        </div>
      )}

      {/* region Project Results */}
      {!pending && results.projects.taskResults.length > 0 && (
        <div className="card p-4 my-4">
          <h2>Results &rarr; Projects</h2>
          {/*<p className="text-muted">*/}
          {/*  {results.projects.remainingProjects} out of{" "}*/}
          {/*  {results.projects.totalProjects} remaining*/}
          {/*</p>*/}

          {results.projects.taskResults.map((result) => (
            <p key={result.message} className="d-sm-flex align-items-center">
              {getIconForTaskResultState(result.status)}{" "}
              <span className="ml-2">{result.message}</span>
            </p>
          ))}
        </div>
      )}
      {/* endregion Project Results */}

      {/* region Project Results */}
      {!pending && results.environments.taskResults.length > 0 && (
        <div className="card p-4 my-4">
          <h2>Results &rarr; Environments</h2>
          {/*<p className="text-muted">*/}
          {/*  {results.projects.remainingProjects} out of{" "}*/}
          {/*  {results.projects.totalProjects} remaining*/}
          {/*</p>*/}

          {results.environments.taskResults.map((result) => (
            <p key={result.message} className="d-sm-flex align-items-center">
              {getIconForTaskResultState(result.status)}{" "}
              <span className="ml-2">{result.message}</span>
            </p>
          ))}
        </div>
      )}
      {/* endregion Project Results */}
    </div>
  );
};

const getIconForTaskResultState = (
  state: "failed" | "completed"
): ReactNode => {
  switch (state) {
    case "completed":
      return <BsCheck className="d-block text-success" />;
    case "failed":
      return <BsX className="d-block text-danger" />;
    default:
      return null;
  }
};

export const ImportFromLaunchDarklyContainer = () => {
  const {
    errors,
    performImport,
    results,
    pending,
  } = useImportFromLaunchDarkly();

  return (
    <ImportFromLaunchDarkly
      errors={errors}
      results={results}
      onSubmit={performImport}
      pending={pending}
    />
  );
};
