import React from 'react';
import Layout from '@/app/layout';

export function Home() {
  return (
    <Layout>
      <div className="flex flex-col items-center min-h-screen py-2">
        <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-4">
          <h2 className="text-2xl font-semibold">Welcome to the Home Page</h2>
          <p className="mt-2 text-gray-600">This is a simple home page.</p>
        </div>
      </div>
    </Layout>
    
      
  );
}
export default Home;