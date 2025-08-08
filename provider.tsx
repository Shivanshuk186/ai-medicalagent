'use client';
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { UserDetailContext } from "./context/UserDetailcontext";

export type UserDetail = {
    name: string;
    email: string;
    credits: number;
}

function Provider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>){

    const{user}=useUser();
    const [userDetail,setUserDetail]= useState<any>();
    useEffect(() => {
        CreateNewUser();
    },[]);

    const CreateNewUser = async() =>{
        const result = await axios.post("/api/users");
        console.log(result.data)
        setUserDetail(result.data);
    }

    return (
        <div>
            <UserDetailContext.Provider value={{userDetail,setUserDetail}}>
            {children}
            </UserDetailContext.Provider></div>
    )
}

export default Provider;