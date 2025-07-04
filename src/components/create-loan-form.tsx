"use client";

import { useState, FormEvent, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // For fetching current user and users list

interface UserOption {
  id: string;
  name: string; // Using name which could be displayName or username
}

export default function CreateLoanForm({ onLoanCreated }: { onLoanCreated: () => void }) {
  const { data: session } = useSession();
  const [lenderId, setLenderId] = useState<string>('');
  const [borrowerId, setBorrowerId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  // const [currency, setCurrency] = useState<string>('JPY'); // Defaulting in API
  const [loanDate, setLoanDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today
  const [dueDate, setDueDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]); // For user selection dropdowns

  const currentUserId = (session?.user as any)?.id;

  // Placeholder for fetching users - In a real app, you'd fetch this from an API endpoint
  // For now, we'll just allow inputting IDs or pre-populate if session user exists
  useEffect(() => {
    // This is a simplified user fetching. Replace with a call to /api/users/search or similar
    const fetchUsers = async () => {
      // Dummy users for now. In a real app, fetch from /api/users
      // Or provide a search input
      if (session) {
        const fetchedUsers = [ // Simulating a user list
            { id: (session.user as any).id, name: (session.user as any).displayName || (session.user as any).username || (session.user as any).email || 'Current User' }
            // Add other users if available or implement a search
        ];
        // A real app would fetch a list of users the current user can transact with
        // For now, we will just add the current user to the list for selection
        // and expect the other party's ID to be known or searched.
        // This is a placeholder for a proper user search/selection UI.

        // Example:
        // const response = await fetch('/api/users/search?q=');
        // const data = await response.json();
        // setUsers(data.map(u => ({id: u.id, name: u.displayName || u.username })));
         setUsers(fetchedUsers);
         if (currentUserId) {
            // Pre-select current user as lender by default, user can change this
            setLenderId(currentUserId);
         }
      }
    };
    fetchUsers();
  }, [session, currentUserId]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!currentUserId) {
        setError("You must be logged in to create a loan.");
        setIsLoading(false);
        return;
    }

    if (lenderId !== currentUserId && borrowerId !== currentUserId) {
        setError("As the logged-in user, you must be either the lender or the borrower.");
        setIsLoading(false);
        return;
    }
    if (lenderId === borrowerId) {
        setError("Lender and borrower cannot be the same person.");
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lenderId,
          borrowerId,
          amount: parseFloat(amount),
          loanDate,
          dueDate: dueDate || null, // Send null if empty
          description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create loan');
      }

      // Reset form or give feedback
      setLenderId(currentUserId || ''); // Reset lender to current user or empty
      setBorrowerId('');
      setAmount('');
      setDueDate('');
      setDescription('');
      alert('Loan created successfully!');
      onLoanCreated(); // Callback to refresh list or navigate
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md shadow-sm">
      <h2 className="text-2xl font-semibold">Create New Loan</h2>

      {/* User selection will be very basic for now.
          In a real app, this would be a search component or richer dropdown. */}
      <div>
        <label htmlFor="lenderId" className="block text-sm font-medium text-gray-700">Lender</label>
        <select
          id="lenderId"
          value={lenderId}
          onChange={(e) => setLenderId(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select Lender</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.name} (ID: {user.id})</option>
          ))}
          {/* Allow manual input if user not in minimal list - this part needs improvement for UX */}
          { !users.find(u => u.id === lenderId) && lenderId && <option value={lenderId}>ID: {lenderId} (Manually entered)</option> }
        </select>
        { currentUserId && <p className="text-xs text-gray-500 mt-1">You are logged in as: { (session?.user as any)?.displayName || (session?.user as any)?.username }. Your ID is {currentUserId}.</p> }
        <input
            type="text"
            placeholder="Enter Lender User ID if not in list"
            value={lenderId}
            onChange={(e) => setLenderId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="borrowerId" className="block text-sm font-medium text-gray-700">Borrower</label>
         <select
          id="borrowerId"
          value={borrowerId}
          onChange={(e) => setBorrowerId(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select Borrower</option>
           {users.map(user => (
            <option key={user.id} value={user.id}>{user.name} (ID: {user.id})</option>
          ))}
          { !users.find(u => u.id === borrowerId) && borrowerId && <option value={borrowerId}>ID: {borrowerId} (Manually entered)</option> }
        </select>
        <input
            type="text"
            placeholder="Enter Borrower User ID if not in list"
            value={borrowerId}
            onChange={(e) => setBorrowerId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (JPY)</label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="loanDate" className="block text-sm font-medium text-gray-700">Loan Date</label>
        <input
          type="date"
          id="loanDate"
          value={loanDate}
          onChange={(e) => setLoanDate(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date (Optional)</label>
        <input
          type="date"
          id="dueDate"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create Loan'}
      </button>
    </form>
  );
}
