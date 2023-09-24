import {
    Alert,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    ToastAndroid,
  } from 'react-native';
  import {useAuthorization} from './AuthProvider';
  import {useProgram} from './ProgramProvider';
  import {useConnection} from './ConnectionProvider';
  import {
    transact,
    Web3MobileWallet,
  } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
  import {LAMPORTS_PER_SOL, Transaction, TransactionInstruction} from '@solana/web3.js';
  import {useState} from 'react';
import React from 'react';
  

  const floatingActionButtonStyle = StyleSheet.create({
    container: {
      height: 64,
      width: 64,
      alignItems: 'center',
      borderRadius: 40,
      justifyContent: 'center',
      elevation: 4,
      marginBottom: 4,
      backgroundColor: 'blue',
    },
  
    text: {
      fontSize: 24,
      color: 'white',
    },
  });
  
  export function CounterButton(){
    const {authorizeSession} = useAuthorization();
    const {program, counterAddress} = useProgram();
    const {connection} = useConnection();
    const [isTransactionInProgress, setIsTransactionInProgress] = useState(false);

    const showToastOrAlert = (message: string) => {
        if (Platform.OS == 'android') {
          ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
          Alert.alert(message);
        }
    }

    const incrementCounter = () => {
        incrementDecrementCounter(true);
    }

    const decrementCounter = () => {
        incrementDecrementCounter(false);
    }

    const incrementDecrementCounter = (shouldIncrement: boolean) => {

        if (!program || !counterAddress) return;

        if (!isTransactionInProgress) {
            setIsTransactionInProgress(true);

            transact(async (wallet: Web3MobileWallet) => {
                const authResult = await authorizeSession(wallet);
                const latestBlockhashResult = await connection.getLatestBlockhash();

                let ix: TransactionInstruction;
                if(shouldIncrement){
                    ix = await program.methods
                    .increment()
                    .accounts({counter: counterAddress, user: authResult.publicKey})
                    .instruction();
                } else {    
                    ix = await program.methods
                    .decrement()
                    .accounts({counter: counterAddress, user: authResult.publicKey})
                    .instruction();
                }

                const balance = await connection.getBalance(authResult.publicKey);
                console.log(`Wallet ${authResult.publicKey} has a balance of ${balance}`);

                // When on Devnet you may want to transfer SOL manually per session, due to Devnet's airdrop rate limit
                const minBalance = LAMPORTS_PER_SOL / 1000;
                if(balance < minBalance){
                  console.log(`requesting airdrop for ${authResult.publicKey} on ${connection.rpcEndpoint}`);
                  await connection.requestAirdrop(authResult.publicKey, minBalance * 2);
                }

                const transaction = new Transaction({
                    ...latestBlockhashResult,
                    feePayer: authResult.publicKey,
                }).add(ix);

                const signature = await wallet.signAndSendTransactions({
                    transactions: [transaction],
                });

                showToastOrAlert(`Transaction successful! ${signature}`);

            }).catch((e)=>{
                console.log(e);
                showToastOrAlert(`Error: ${JSON.stringify(e)}`);
            }).finally(()=>{
                setIsTransactionInProgress(false);
            })
        }
    };
  
    return (
      <>
        <Pressable
          style={floatingActionButtonStyle.container}
          onPress={incrementCounter}>
          <Text style={floatingActionButtonStyle.text}>
            +
          </Text>
        </Pressable>
        <Pressable
          style={floatingActionButtonStyle.container}
          onPress={decrementCounter}>
          <Text style={floatingActionButtonStyle.text}>
            -
          </Text>
        </Pressable>
      </>
    );
  };