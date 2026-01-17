'use client';
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { UserDetailContext } from "./context/UserDetailcontext";
import LoadingSpinner from "./components/LoadingSpinner";

export type UserDetail = {
    name: string;
    email: string;
    credits: number;
    isPremium: boolean;
    premiumExpiresAt?: string;
    monthlyConsultations?: number;
    consultationsResetDate?: string;
}

function Provider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>){

    const { user, isLoaded } = useUser();
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const retryCountRef = useRef(0);
    const maxRetries = 3;

    useEffect(() => {
        if (isLoaded && user) {
            retryCountRef.current = 0;
            CreateNewUser();
        } else if (isLoaded && !user) {
            setLoading(false);
        }
    }, [isLoaded, user]);

    const CreateNewUser = async(retryAttempt = 0) => {
        try {
            setLoading(true);
            setError(null);
            
            // Only call the API if the user is authenticated
            if (!user) {
                setLoading(false);
                return;
            }
            
            const result = await axios.post("/api/users", {}, {
                timeout: 10000 // 10 second timeout
            });
            
            if (result.data) {
                setUserDetail(result.data);
                retryCountRef.current = 0;
            } else {
                throw new Error('No user data returned');
            }
        } catch (err: any) {
            console.error(`Error creating user (attempt ${retryAttempt + 1}):`, err);
            
            // Retry on network errors or 5xx errors
            if (retryAttempt < maxRetries && (
                !err.response || 
                err.response.status >= 500 || 
                err.code === 'ECONNABORTED'
            )) {
                const delayMs = Math.pow(2, retryAttempt) * 1000; // Exponential backoff
                setTimeout(() => {
                    CreateNewUser(retryAttempt + 1);
                }, delayMs);
                return;
            }
            
            const errorMsg = err.response?.data?.error || err.message || 'Failed to load user data';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    }

    const refreshUserDetails = async() => {
        try {
            if (!user) return;
            
            const result = await axios.post("/api/users", {}, {
                timeout: 10000
            });
            
            if (result.data) {
                setUserDetail(result.data);
            }
        } catch (err: any) {
            console.error('Error refreshing user details:', err);
        }
    }

    if (loading && user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <LoadingSpinner size="lg" text="Loading your profile..." />
            </div>
        );
    }

    if (error && user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center max-w-md p-6">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Profile</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <button 
                        onClick={() => {
                            retryCountRef.current = 0;
                            CreateNewUser();
                        }} 
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <UserDetailContext.Provider value={{ userDetail, setUserDetail, refreshUserDetails }}>
            {children}
        </UserDetailContext.Provider>
    )
}

export default Provider;