"use client";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";

export default function UserDashboard() {
  const { data: session } = useSession();

  return (
    <>
      <div className="space-y-6">
        <div className="text-center mb-8 py-8">
          <h2 className="text-3xl font-bold light:text-gray-900 dark:text-white mb-2">
            Account
          </h2>
          <p className="text-lg light:text-gray-600 dark:text-gray-400">
            Manage your profile and session
          </p>
        </div>
        <div className="light:bg-white dark:bg-slate-800 rounded-2xl shadow-xl border light:border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="text-left">
              <p className="text-xl font-semibold">
                {session?.user?.name || "User"}
              </p>
              <p className="text-muted-foreground">
                {session?.user?.email || ""}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => signOut({ callbackUrl: "/home" })}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
