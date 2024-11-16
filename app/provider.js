"use client";
import { db } from "@/configs/db";
import { USER_TABLE } from "@/configs/schema";
import { useUser } from "@clerk/nextjs";
import { eq } from "drizzle-orm";
import React, { useEffect } from "react";

function Provider({ children }) {
  const { user } = useUser();

  useEffect(() => {
    user && CheckIsNewUser();
  }, [user]);
  const CheckIsNewUser = async () => {
    // Check if the user already exist
    const result = await db
      .select()
      .from(USER_TABLE)
      .where(eq(USER_TABLE.email, user?.primaryEmailAddress?.emailAddress));

    console.log(result);
    if (result.length === 0) {
      //If not add to db
      const userResp = await db
        .insert(USER_TABLE)
        .values({
          userName: user?.fullName,
          email: user?.primaryEmailAddress?.emailAddress,
        })
        .returning({ id: USER_TABLE.id });

      console.log(userResp);
    }
  };
  return <div>{children}</div>;
}

export default Provider;
