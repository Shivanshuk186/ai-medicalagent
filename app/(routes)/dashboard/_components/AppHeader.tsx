import React from "react";
import Image from "next/image";
import { index } from "drizzle-orm/gel-core";
import { h2 } from "motion/react-client";
import { UserButton } from "@clerk/nextjs";


const menuOptions = [
  {
    id: 1,
    name: 'Home',
    path: '/dashboard',
  },
  {
    id: 2,
    name: 'History',
    path: '/dashboard/history',
  },
  {
    id: 3,
    name: 'Pricing',
    path: '/pricing', // fixed typo here
  },
  {
    id: 4,
    name: 'Profile',
    path: '/profile',
  },
];



function AppHeader() {
    return (

        <div className="flex item-center justify-between p-4 shadow px-10 md:px-20 lg:px-40 " ><div className="flex items-center justify-between"><Image src={'/logomain.svg'} alt='logo' width={40} height={40} /><span className="font-bold p-2">EchoDocAI</span></div>
            
            <div className='hidden md:flex gap-12 items-center'>
                {menuOptions.map((option,index)=>(
                    <h2 className="hover:font-bold cursor-pointer transition-all">{option.name}</h2>
                ))}
            </div>
            <UserButton/>
        </div>

    )
}
export default AppHeader;

