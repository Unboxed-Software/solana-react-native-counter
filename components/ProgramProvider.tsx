import {
  AnchorProvider,
  IdlAccounts,
  Program,
  setProvider,
} from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { AnchorCounter, IDL } from "../models/anchor-counter";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useConnection } from "./ConnectionProvider";

export type CounterAccount = IdlAccounts<AnchorCounter>["counter"];

export type ProgramContextType = {
  program: Program<AnchorCounter> | null;
  counterAddress: PublicKey | null;
};

export const ProgramContext = createContext<ProgramContextType>({
  program: null,
  counterAddress: null,
});

export type ProgramProviderProps = {
  children: ReactNode;
};

export function ProgramProvider({ children }: ProgramProviderProps) {
  const { connection } = useConnection();
  const [program, setProgram] = useState<Program<AnchorCounter> | null>(null);
  const [counterAddress, setCounterAddress] = useState<PublicKey | null>(null);

  const setup = useCallback(async () => {
    const programId = new PublicKey(
      "ALeaCzuJpZpoCgTxMjJbNjREVqSwuvYFRZUfc151AKHU",
    );

    // MockWallet is a placeholder wallet used for initializing the AnchorProvider.
    // In a mobile app, we don't need a real wallet here because the actual signing
    // will be done by the user's mobile wallet app. This mock wallet allows us to
    // set up the provider without a real wallet instance.

    const MockWallet = {
      signTransaction: () => Promise.reject(),
      signAllTransactions: () => Promise.reject(),
      publicKey: Keypair.generate().publicKey,
    };

    const provider = new AnchorProvider(connection, MockWallet, {});
    setProvider(provider);

    const programInstance = new Program<AnchorCounter>(
      IDL,
      programId,
      provider,
    );

    const [counterProgramAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from("counter")],
      programId,
    );

    setProgram(programInstance);
    setCounterAddress(counterProgramAddress);
  }, [connection]);

  useEffect(() => {
    setup();
  }, [setup]);

  const value: ProgramContextType = useMemo(
    () => ({
      program,
      counterAddress,
    }),
    [program, counterAddress],
  );

  return (
    <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
  );
}

export const useProgram = () => useContext(ProgramContext);