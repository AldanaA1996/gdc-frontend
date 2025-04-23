import { User, Volunteer } from "@/app/types/strapi-entities"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { removeToken } from "../services/api"

type AuthenticationState = {
	token: string | null
	user: User | null
	volunteer: Volunteer | null
	logout: () => void
	setToken: (token: string) => void
	removeToken: () => void
	setCurrentUser: (user: User) => void
	removeCurrentUser: () => void
	setCurrentVolunteer: (user: Volunteer) => void
	removeCurrentVolunteer: () => void
}

export const useAuthenticationStore = create<AuthenticationState>()(
	persist(
		(set, get) => ({
			token: null,
			user: null,
			volunteer: null,
			logout: () => {
				set({ token: null })
				set({ user: null })
				set({ volunteer: null })

				removeToken()
			},
			setToken: (token) => set({ token }),
			removeToken: () => set({ token: null }),
			setCurrentUser: (user) => set({ user }),
			removeCurrentUser: () => set({ user: null }),
			setCurrentVolunteer: (volunteer) => set({ volunteer }),
			removeCurrentVolunteer: () => set({ volunteer: null })
		}),
		{
			name: "authentication",
			storage: createJSONStorage(() => sessionStorage)
		}
	)
)
