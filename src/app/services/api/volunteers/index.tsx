import { User, Volunteer } from "@/app/types/strapi-entities"
import {
	ApiResponse,
	EntityMetadata,
	findEntity,
	handleUpload,
	MediaFieldDescriptor,
	StrapiFindParams,
	strapiRequest,
	verifyMediaFields
} from ".."

export const VOLUNTEER_ENTITY_METADATA: EntityMetadata = {
	plural: "volunteers",
	singular: "volunteer",
	modelRefName: "api::volunteer.volunteer",
	mediaFields: {
		credential: "image"
	}
}

const VOLUNTEERS = VOLUNTEER_ENTITY_METADATA.plural

const MEDIA_FIELDS: MediaFieldDescriptor = VOLUNTEER_ENTITY_METADATA.mediaFields

export const requestVolunteerByUser = async (
	user: User
): ApiResponse<Volunteer> => {
	try {
		const result = await getVolunteersBy({
			filters: {
				volunteerBethelID: { $eq: user.username }
			}
		})

		if (result.data.length === 1) {
			return { data: result.data[0] }
		}

		return { error: { data: { error: { name: "DuplicateVolunteerError" } } } }
	} catch (error) {
		return { error: error?.response }
	}
}

export const getAllVolunteers = () =>
	strapiRequest<Volunteer[]>(VOLUNTEERS, "find")

export const getVolunteerById = (documentId: string) =>
	strapiRequest<Volunteer>(VOLUNTEERS, "findOne", { documentId })

export const createVolunteer = async (
	data: Partial<Volunteer>
): ApiResponse<Volunteer> => {
	const currentMediaFiles = verifyMediaFields(MEDIA_FIELDS, data)

	if (!currentMediaFiles.length) {
		return strapiRequest<Volunteer>(VOLUNTEERS, "create", { data })
	} else {
		const result = await strapiRequest<Volunteer>(VOLUNTEERS, "create", {
			data
		})
		const uploadResult = await handleUpload<Volunteer>(
			currentMediaFiles,
			VOLUNTEER_ENTITY_METADATA,
			result.data.id,
			result.data.documentId
		)

		if (Array.isArray(uploadResult)) {
			return uploadResult[uploadResult.length - 1]
		}

		return uploadResult
	}
}

export const updateVolunteer = async (
	documentId: string,
	data: Partial<Volunteer>
) => {
	const currentMediaFiles = verifyMediaFields(MEDIA_FIELDS, data)

	debugger

	if (!currentMediaFiles.length) {
		return strapiRequest<Volunteer>(VOLUNTEERS, "update", { documentId, data })
	} else {
		const result = await strapiRequest<Volunteer>(VOLUNTEERS, "update", {
			documentId,
			data
		})

		if (result.error) {
			return result
		}

		const uploadResult = await handleUpload<Volunteer>(
			currentMediaFiles,
			VOLUNTEER_ENTITY_METADATA,
			result.data.id,
			documentId
		)

		if (Array.isArray(uploadResult)) {
			return uploadResult[uploadResult.length - 1]
		}

		return uploadResult
	}
}
export const deleteVolunteer = (documentId: string) =>
	strapiRequest(VOLUNTEERS, "delete", { documentId })

export const getVolunteersBy = (params: StrapiFindParams) =>
	findEntity<Volunteer>(VOLUNTEERS, params)
