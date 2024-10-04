import { View, Text, StyleSheet } from "react-native";
import { useConnection } from "./ConnectionProvider";
import { useProgram, CounterAccount } from "./ProgramProvider";
import { useEffect, useState } from "react";
import { AccountInfo } from "@solana/web3.js";
import React from "react";

const counterStyle = StyleSheet.create({
  counter: {
    fontSize: 48,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
  },
});

export function CounterView() {
  const { connection } = useConnection();
  const { program, counterAddress } = useProgram();
  const [counter, setCounter] = useState<CounterAccount>();

  // Fetch Counter Info
  useEffect(() => {
    if (!program || !counterAddress) return;

    program.account.counter.fetch(counterAddress).then(setCounter);

    const subscriptionId = connection.onAccountChange(
      counterAddress,
      (accountInfo: AccountInfo<Buffer>) => {
        try {
          const data = program.coder.accounts.decode(
            "counter",
            accountInfo.data,
          );
          setCounter(data);
        } catch (error) {
          console.log("account decoding error: " + error);
        }
      },
    );

    return () => {
      connection.removeAccountChangeListener(subscriptionId);
    };
  }, [program, counterAddress, connection]);

  if (!counter) return <Text>Loading...</Text>;

  return (
    <View>
      <Text>Current counter</Text>
      <Text style={counterStyle.counter}>{counter.count.toString()}</Text>
    </View>
  );
}