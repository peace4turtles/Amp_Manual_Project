'use client';

import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { Authenticator } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import outputs from "../../amplify_outputs.json";
import { fetchAuthSession } from '@aws-amplify/core';
import { parseAmplifyConfig } from "aws-amplify/utils";

const amplifyConfig = parseAmplifyConfig(outputs);
Amplify.configure(
  {
    ...amplifyConfig,
    API: {
      ...amplifyConfig.API,
      REST: outputs.custom.API,
    },
    // Auth: {
    //   Cognito: {
    //     userPoolId: env.cognitoUserPoolId || '',
    //     userPoolClientId: env.cognitoUserPoolWebClientId || '',
    //   }
    // },
  },
  {
    API: {
      REST: {
        retryStrategy: {
          strategy: 'no-retry', // Overrides default retry strategy
        },
      }
    }
  },
);

export default function Home() {
  const [items, setItems] = useState([]);
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   fetch('https://b54uzz1ot0.execute-api.us-east-2.amazonaws.com/dev/public')
  //     .then(res => res.json())
  //     .then(data => {
  //       console.log('Raw API response:', data);
  //       setRawData(data);
  //       setItems(data.Items || data || []);
  //       setLoading(false);
  //     })
  //     .catch(err => {
  //       console.error('Fetch error:', err);
  //       setLoading(false);
  //     });
  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const session = await fetchAuthSession();
        const accessToken = session.tokens?.accessToken?.toString();
        const idToken = session.tokens?.idToken?.toString();
        
        console.log('Session:', session);
        console.log('Access Token exists:', !!accessToken);
        console.log('ID Token exists:', !!idToken);
        console.log('Token', accessToken);

        if (session.tokens) {
          console.log('User is authenticated');
          
          if (accessToken) {
              const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
              const currentTime = Math.floor(Date.now() / 1000);
              const isExpired = tokenPayload.exp < currentTime;
              
              console.log('Token payload:', tokenPayload);
              console.log('Token expires at:', new Date(tokenPayload.exp * 1000));
              console.log('Current time:', new Date(currentTime * 1000));
              console.log('Is token expired:', isExpired);
          }
        }

        const response = await fetch('https://b54uzz1ot0.execute-api.us-east-2.amazonaws.com/dev/cognito-auth-path', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log('Raw API response:', data);
        setRawData(data);
        setItems(data.Items || data || []);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Authenticator>
      {({ signOut, user }) => (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
          <h1 className="text-xl font-semibold">Hello, {user?.username}</h1>
            <button
              onClick={signOut}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Sign out
            </button>
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <Image
          src="https://amplify-d335597a80fxjy-ma-amplifyteamdrivebucket28-i47hjvvkemxz.s3.us-east-2.amazonaws.com/RSNATestLogo.png"
          alt="RSNA Logo"
          width={180}
          height={38}
          priority />
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
            Items: 
            {items ? JSON.stringify(items, null, 2) : 'null'}{'\n'}
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
     )}
    </Authenticator>
  );
}
