import { PostFeatureResponse } from "../../../types/openapi";
import { createApiRequestHandler } from "../../util/handler";
import { postFeatureValidator } from "../../validators/openapi";
import { createFeature } from "../../models/FeatureModel";
import { FeatureInterface } from "../../../types/feature";
import { getEnabledEnvironments } from "../../util/features";
import {
  addIdsToRules,
  getApiFeatureObj,
  getSavedGroupMap,
} from "../../services/features";
import { auditDetailsCreate } from "../../services/audit";

export const postFeature = createApiRequestHandler(postFeatureValidator)(
  async (req): Promise<PostFeatureResponse> => {
    req.checkPermissions("manageFeatures", req.body.project);

    // TODO someo f htese should be required no?
    const feature: FeatureInterface = {
      defaultValue: req.body.defaultValue || "",
      valueType: req.body.valueType || "boolean",
      // TODO probaaably want this to be required
      owner: req.body.owner || "",
      description: req.body.description || "",
      project: req.body.project || "",
      // @ts-expect-error TODO translation step for env settings
      environmentSettings: {
        ...(req.body.environments || {}),
      },
      dateCreated: new Date(),
      dateUpdated: new Date(),
      organization: req.organization.id,
      id: req.body.id.toLowerCase(),
      archived: req.body.archived || false,
      revision: {
        version: 1,
        comment: "New feature",
        date: new Date(),
        publishedBy: {
          //TODO should be required
          id: req.body.owner || "",
          //TODO should be required
          email: req.body.owner || "",
          //TODO should be required
          name: req.body.owner || "",
        },
      },
      jsonSchema: {
        schema: "",
        date: new Date(),
        enabled: false,
      },
    };

    req.checkPermissions(
      "publishFeatures",
      feature.project,
      getEnabledEnvironments(feature)
    );

    addIdsToRules(feature.environmentSettings, feature.id);

    await createFeature(req.organization, req.eventAudit, feature);

    await req.audit({
      event: "feature.create",
      entity: {
        object: "feature",
        id: feature.id,
      },
      details: auditDetailsCreate(feature),
    });

    const groupMap = await getSavedGroupMap(req.organization);

    return {
      feature: getApiFeatureObj(feature, req.organization, groupMap),
    };
  }
);
