import { Material } from "@/app/types/strapi-entities";
import { EntityMetadata, findEntity, StrapiFindParams, strapiRequest } from "..";

export const MATERIAL_ENTITY_METADATA: EntityMetadata = {
    plural: "materials",
    singular: "material",
    modelRefName: "api::material.material"
};

const MATERIALS = MATERIAL_ENTITY_METADATA.plural;

export const getAllMaterials = () => strapiRequest<Material[]>(MATERIALS, "find");

export const getMaterialById = (documentId: string) =>
    strapiRequest<Material>(MATERIALS, "findOne", { documentId });

export const createMaterial = (data: Partial<Material>) => {
    return strapiRequest<Material>(MATERIALS, "create", {
        data,
        params: { populate: "*" }
    });
}

export const updateMaterial = (documentId: string, data: Partial<Material>) => {
    return strapiRequest<Material>(MATERIALS, "update", {
        documentId,
        data,
        params: {
            populate: "*"
        }
    });
};

export const deleteMaterial = (documentId: string) =>
    strapiRequest(MATERIALS, "delete", { documentId });

export const getMaterialBy = (params: StrapiFindParams) =>
    findEntity<Material>(MATERIALS, params);
