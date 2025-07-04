"use client";

import { useEffect, useState } from 'react';

// Define a type for the loan object based on your Prisma schema and API response
interface User {
  id: string;
  name?: string | null;
  displayName?: string | null;
  username?: string | null;
  image?: string | null;
}

interface Loan {
  id: string;
  amount: number;
  currency: string;
  loanDate: string;
  dueDate?: string | null;
  description?: string | null;
  status: string;
  lender: User;
  borrower: User;
  createdAt: string;
}

export default function LoanList() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLoans = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/loans');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch loans: ${response.statusText}`);
        }
        const data = await response.json();
        setLoans(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoans();
  }, []);

  if (isLoading) return <p>Loading loans...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">My Loans</h2>
      {loans.length === 0 ? (
        <p>No loans found.</p>
      ) : (
        <ul className="space-y-3">
          {loans.map((loan) => (
            <li key={loan.id} className="p-4 border rounded-md shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">
                  {loan.lender.displayName || loan.lender.username || 'Unknown Lender'} to {loan.borrower.displayName || loan.borrower.username || 'Unknown Borrower'}
                </h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  loan.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' :
                  loan.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  loan.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {loan.status}
                </span>
              </div>
              <p className="text-lg">{loan.amount} {loan.currency}</p>
              <p className="text-sm text-gray-600">Loan Date: {new Date(loan.loanDate).toLocaleDateString()}</p>
              {loan.dueDate && <p className="text-sm text-gray-600">Due Date: {new Date(loan.dueDate).toLocaleDateString()}</p>}
              {loan.description && <p className="text-sm text-gray-500 mt-1">Description: {loan.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
