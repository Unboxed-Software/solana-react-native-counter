// Polyfills at the top
import "text-encoding-polyfill";
import "react-native-get-random-values";
import { Buffer } from "buffer";
global.Buffer = Buffer;

import { clusterApiUrl } from "@solana/web3.js";
import { ConnectionProvider } from "./components/ConnectionProvider";
import { AuthorizationProvider } from "./components/AuthProvider";
import { ProgramProvider } from "./components/ProgramProvider";
import { MainScreen } from "./screens/MainScreen"; // Going to make this
import React from "react";

export default function App() {
  const cluster = "devnet";
  const endpoint = clusterApiUrl(cluster);
  // const cluster = "localhost" as any;
  // const endpoint = 'http://10.0.2.2:8899';

  return (
    // ConnectionProvider: Manages the connection to the Solana network
    <ConnectionProvider
      endpoint={endpoint}
      config={{ commitment: "processed" }}
    >
      // AuthorizationProvider: Handles wallet authorization
      <AuthorizationProvider cluster={cluster}>
        // ProgramProvider: Provides access to the Solana program
        <ProgramProvider>
          <MainScreen />
        </ProgramProvider>
      </AuthorizationProvider>
    </ConnectionProvider>
  );
}