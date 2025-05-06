import { MaterialMovement } from "@/app/types/strapi-entities";
import { EntityMetadata, findEntity, StrapiFindParams, strapiRequest } from "..";

export const MATERIAL_MOVEMENT_ENTITY_METADATA: EntityMetadata = {
    plural: "materials-movements",
    singular: "material-movement",
    modelRefName: "api::material-movement.material-movement"
};

const MATERIAL_MOVEMENTS = MATERIAL_MOVEMENT_ENTITY_METADATA.plural;

export const getAllMaterialMovements = () =>
    strapiRequest<MaterialMovement[]>(MATERIAL_MOVEMENTS, "find");

export const getMaterialMovementById = (documentId: string) =>
    strapiRequest<MaterialMovement>(MATERIAL_MOVEMENTS, "findOne", { documentId });

export const createMaterialMovement = (data: Partial<MaterialMovement>) => {
    return strapiRequest<MaterialMovement>(MATERIAL_MOVEMENTS, "create", {
        data,
        params: { populate: "*" }
    });
}

export const updateMaterialMovement = (documentId: string, data: Partial<MaterialMovement>) => {
    return strapiRequest<MaterialMovement>(MATERIAL_MOVEMENTS, "update", {
        documentId,
        data,
        params: {
            populate: "*"
        }
    });
};

export const deleteMaterialMovement = (documentId: string) =>
    strapiRequest(MATERIAL_MOVEMENTS, "delete", { documentId });

export const getMaterialMovementBy = (params: StrapiFindParams) =>
    findEntity<MaterialMovement>(MATERIAL_MOVEMENTS, params);