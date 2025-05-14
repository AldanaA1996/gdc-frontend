import { Tool } from "@/app/types/strapi-entities"
import { EntityMetadata, findEntity, StrapiFindParams, strapiRequest } from ".."

export const TOOL_ENTITY_METADATA: EntityMetadata = {
    plural: "tools ",
    singular: "tool",
    modelRefName: "api::tool.tool"
}

const TOOLS = TOOL_ENTITY_METADATA.plural

export const getAllTools = () =>
    strapiRequest<Tool[]>(TOOLS, "find" , {
        params: { populate: "*" }
        
    });

export const getToolById = (documentId: string) =>
    strapiRequest<Tool>(TOOLS, "findOne", { documentId })

export const createTool = (data: Partial<Tool>) => {
    return strapiRequest<Tool>(TOOLS, "create", {
        data,
        params: { populate: "*" }
    })
}

export const updateTool = (
    documentId: string,
    data: Partial<Tool>
) => {
    return strapiRequest<Tool>(TOOLS, "update", {
        documentId,
        data,
        params: {
            populate: "*"
        }
    })
}

export const deleteTool = (documentId: string) =>
    strapiRequest(TOOLS, "delete", { documentId })

export const getGroupBy = (params: StrapiFindParams) =>
    findEntity<Tool>(TOOLS, params)
