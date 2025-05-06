import { User } from "@/app/types/strapi-entities"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { removeToken } from "../services/api"

type AuthenticationState = {
	token: string | null
	user: User | null
	
	logout: () => void
	setToken: (token: string) => void
	removeToken: () => void
	setCurrentUser: (user: User) => void
	removeCurrentUser: () => void
	
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
				

				removeToken()
			},
			setToken: (token) => set({ token }),
			removeToken: () => set({ token: null }),
			setCurrentUser: (user) => set({ user }),
			removeCurrentUser: () => set({ user: null }),
			
		}),
		{
			name: "authentication",
			storage: createJSONStorage(() => sessionStorage)
		}
	)
)
