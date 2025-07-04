"use client"; // Required for SessionProvider and client-side components

import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import LoanList from '@/components/loan-list';
import CreateLoanForm from '@/components/create-loan-form';
import { useState } from 'react';

// Wrap the main content in a component that uses SessionProvider
export default function HomePageWrapper() {
  return (
    <SessionProvider>
      <HomePage />
    </SessionProvider>
  );
}

function HomePage() {
  const { data: session, status } = useSession();
  const [refreshKey, setRefreshKey] = useState(0); // Used to trigger re-fetch in LoanList

  const handleLoanCreated = () => {
    setRefreshKey(prevKey => prevKey + 1); // Increment key to re-render LoanList
  };

  if (status === "loading") {
    return <p className="flex justify-center items-center min-h-screen">Loading session...</p>;
  }

  return (
    <main className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold">LoanLedger</h1>
        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm">Signed in as</p>
                <p className="font-semibold">
                  {session.user?.name || (session.user as any)?.username || session.user?.email}
                </p>
                {(session.user as any)?.id && <p className="text-xs text-gray-500">ID: {(session.user as any).id}</p>}

              </div>
              {session.user?.image && (
                <img src={session.user.image} alt="User avatar" className="w-10 h-10 rounded-full" />
              )}
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn('discord')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sign In with Discord
            </button>
          )}
        </div>
      </header>

      {session ? (
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <CreateLoanForm onLoanCreated={handleLoanCreated} />
          </div>
          <div>
            {/* Pass refreshKey to LoanList if it needs to re-fetch on its own after creation */}
            {/* For now, LoanList fetches on mount. A key change will re-mount it. */}
            <LoanList key={refreshKey} />
          </div>
        </div>
      ) : (
        <p className="text-center text-xl">Please sign in to manage your loans.</p>
      )}
    </main>
  );
}
