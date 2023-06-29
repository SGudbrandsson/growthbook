import { DataSourceInterfaceWithParams } from "@/../back-end/types/datasource";
import { FaPlus } from "react-icons/fa";
import clsx from "clsx";
import { useDefinitions } from "@/services/DefinitionsContext";

type Props = {
  setShowAutoGenerateMetricsModal: (value: boolean) => void;
  datasource?: DataSourceInterfaceWithParams;
  size?: "lg";
};

export default function DiscoverMetricsButton({
  setShowAutoGenerateMetricsModal,
  datasource,
  size,
}: Props) {
  const { datasources } = useDefinitions();
  const showButton = () => {
    if (datasource) {
      // If a datasource was passed in, only show the button if the datasource supports auto metrics
      return datasource.properties?.supportsAutoGeneratedMetrics || false;
    }

    // Otherwise, only show the button if atleast one datasource supports auto metrics
    return datasources.some(
      (datasource) =>
        datasource.properties?.supportsAutoGeneratedMetrics || false
    );
  };

  return (
    <>
      {showButton() ? (
        <button
          className={clsx(
            size === "lg" ? "btn-lg" : "",
            "btn btn-outline-info font-weight-bold text-nowrap mr-1"
          )}
          onClick={() => setShowAutoGenerateMetricsModal(true)}
        >
          <FaPlus className="mr-1" /> Discover Metrics
        </button>
      ) : null}
    </>
  );
}
