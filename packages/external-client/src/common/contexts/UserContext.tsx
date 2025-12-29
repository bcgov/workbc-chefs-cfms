import { createContext, useMemo, useState } from "react"

interface UserContextState {
    profileExists: boolean
    setUserProfileExists: (value: boolean) => void
}

const UserContext = createContext<UserContextState>({
    profileExists: false,
    setUserProfileExists: () => {}
})

const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [profileExists, setProfileExists] = useState<boolean>(false)

    const setUserProfileExists = (value: boolean) => {
        setProfileExists(value)
    }

    // Use memoization to prevent unnecessary re-renders.
    const valueProp = useMemo(() => ({ profileExists, setUserProfileExists }), [profileExists])

    return <UserContext.Provider value={valueProp}>{children}</UserContext.Provider>
}

export { UserContext, UserProvider }
