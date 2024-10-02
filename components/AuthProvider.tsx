import { Cluster, PublicKey } from "@solana/web3.js";
import {
  Account as AuthorizedAccount,
  AuthorizationResult,
  AuthorizeAPI,
  AuthToken,
  Base64EncodedAddress,
  DeauthorizeAPI,
  ReauthorizeAPI,
} from "@solana-mobile/mobile-wallet-adapter-protocol";
import { toUint8Array } from "js-base64";
import { useState, useCallback, useMemo, ReactNode } from "react";
import React from "react";

const AuthUtils = {
  getAuthorizationFromAuthResult: (
    authResult: AuthorizationResult,
    previousAccount?: Account,
  ): Authorization => {
    const selectedAccount =
      previousAccount === undefined ||
      !authResult.accounts.some(
        ({ address }) => address === previousAccount.address,
      )
        ? AuthUtils.getAccountFromAuthorizedAccount(authResult.accounts[0])
        : previousAccount;

    return {
      accounts: authResult.accounts.map(
        AuthUtils.getAccountFromAuthorizedAccount,
      ),
      authToken: authResult.auth_token,
      selectedAccount,
    };
  },

  getAccountFromAuthorizedAccount: (
    authAccount: AuthorizedAccount,
  ): Account => ({
    ...authAccount,
    publicKey: new PublicKey(toUint8Array(authAccount.address)),
  }),
};

type Account = Readonly<{
  address: Base64EncodedAddress;
  label?: string;
  publicKey: PublicKey;
}>;

type Authorization = Readonly<{
  accounts: Account[];
  authToken: AuthToken;
  selectedAccount: Account;
}>;

const APP_IDENTITY = {
  name: "Solana Counter Incrementor",
};

type AuthorizationProviderContext = {
  accounts: Account[] | null;
  authorizeSession: (wallet: AuthorizeAPI & ReauthorizeAPI) => Promise<Account>;
  deauthorizeSession: (wallet: DeauthorizeAPI) => void;
  onChangeAccount: (nextSelectedAccount: Account) => void;
  selectedAccount: Account | null;
};

const AuthorizationContext = React.createContext<AuthorizationProviderContext>({
  accounts: null,
  authorizeSession: () => {
    throw new Error("Provider not initialized");
  },
  deauthorizeSession: () => {
    throw new Error("Provider not initialized");
  },
  onChangeAccount: () => {
    throw new Error("Provider not initialized");
  },
  selectedAccount: null,
});

type AuthProviderProps = {
  children: ReactNode;
  cluster: Cluster;
};

function AuthorizationProvider({ children, cluster }: AuthProviderProps) {
  const [authorization, setAuthorization] = useState<Authorization | null>(
    null,
  );

  const handleAuthorizationResult = useCallback(
    async (authResult: AuthorizationResult): Promise<Authorization> => {
      const nextAuthorization = AuthUtils.getAuthorizationFromAuthResult(
        authResult,
        authorization?.selectedAccount,
      );
      setAuthorization(nextAuthorization);
      return nextAuthorization;
    },
    [authorization],
  );

  const authorizeSession = useCallback(
    async (wallet: AuthorizeAPI & ReauthorizeAPI) => {
      const authorizationResult = authorization
        ? await wallet.reauthorize({
            auth_token: authorization.authToken,
            identity: APP_IDENTITY,
          })
        : await wallet.authorize({ cluster, identity: APP_IDENTITY });
      return (await handleAuthorizationResult(authorizationResult))
        .selectedAccount;
    },
    [authorization, cluster, handleAuthorizationResult],
  );

  const deauthorizeSession = useCallback(
    async (wallet: DeauthorizeAPI) => {
      if (authorization?.authToken) {
        await wallet.deauthorize({ auth_token: authorization.authToken });
        setAuthorization(null);
      }
    },
    [authorization],
  );

  const onChangeAccount = useCallback((nextAccount: Account) => {
    setAuthorization(currentAuthorization => {
      if (
        currentAuthorization?.accounts.some(
          ({ address }) => address === nextAccount.address,
        )
      ) {
        return { ...currentAuthorization, selectedAccount: nextAccount };
      }
      throw new Error(`${nextAccount.address} is no longer authorized`);
    });
  }, []);

  const value = useMemo(
    () => ({
      accounts: authorization?.accounts ?? null,
      authorizeSession,
      deauthorizeSession,
      onChangeAccount,
      selectedAccount: authorization?.selectedAccount ?? null,
    }),
    [authorization, authorizeSession, deauthorizeSession, onChangeAccount],
  );

  return (
    <AuthorizationContext.Provider value={value}>
      {children}
    </AuthorizationContext.Provider>
  );
}

const useAuthorization = () => React.useContext(AuthorizationContext);

export {
  AuthorizationProvider,
  useAuthorization,
  type Account,
  type AuthProviderProps,
  type AuthorizationProviderContext,
};