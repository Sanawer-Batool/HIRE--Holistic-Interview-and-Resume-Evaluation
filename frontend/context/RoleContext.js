"use client"

import { createContext, useContext, useEffect, useState } from "react"

const RoleContext = createContext(null)

export function RoleProvider({ children }) {
    const [role, setRole] = useState(null)

    useEffect(() => {
        const savedRole = localStorage.getItem("hire_role")
        if (savedRole) setRole(savedRole)
    }, [])

    function selectRole(nextRole) {
        setRole(nextRole)
        localStorage.setItem("hire_role", nextRole)
    }

    function clearRole() {
        setRole(null)
        localStorage.removeItem("hire_role")
    }

    return (
        <RoleContext.Provider value={{ role, selectRole, clearRole }}>
            {children}
        </RoleContext.Provider>
    )
}

export function useRole() {
    const context = useContext(RoleContext)

    if (!context) {
        throw new Error("useRole must be used within a RoleProvider")
    }

    return context
}