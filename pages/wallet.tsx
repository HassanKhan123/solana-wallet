import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { Button, Tooltip, Drawer, Typography } from "antd";
import * as web3 from "@solana/web3.js";
import { hdkey } from "ethereumjs-wallet";
import nacl from "tweetnacl";
import * as ed25519 from "ed25519-hd-key";
import { useGlobalState } from "../context";
import { useRouter } from "next/router";
import TransactionLayout from "../components/TransactionLayout";
import { refreshBalance, handleAirdrop } from "../utils";
import { ArrowRightOutlined, LoadingOutlined } from "@ant-design/icons";
import * as splToken from "@solana/spl-token";
import { TokenListProvider, TokenInfo } from "@solana/spl-token-registry";
import {
  Dashboard,
  Airdrop,
  Question,
} from "../styles/StyledComponents.styles";
import { Account, Keypair } from "@solana/web3.js";
import Link from "next/link";
import { AccountLayout, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import b58 from "b58";

const { Paragraph } = Typography;

let connection;

const Wallet: NextPage = () => {
  const { network, account, balance, setBalance, mnemonic } = useGlobalState();
  const [visible, setVisible] = useState<boolean>(false);
  const [airdropLoading, setAirdropLoading] = useState<boolean>(false);

  const router = useRouter();

  useEffect(() => {
    connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
  }, []);

  if (account) {
    console.log("SECRET====", b58.encode(account?.secretKey));
  }

  useEffect(() => {
    if (!account) {
      router.push("/");
      return;
    }
    showAllHoldings();
    refreshBalance(network, account)
      .then(updatedBalance => {
        setBalance(updatedBalance);
      })
      .catch(err => {
        console.log(err);
      });
  }, [account, router, network]);

  const fetchTokens = async address => {
    return new TokenListProvider().resolve().then(tokens => {
      const tokenList = tokens.filterByClusterSlug("devnet").getList();
      console.log(tokenList);

      return tokenList.filter(tk => tk.address === address);
    });
  };

  const showAllHoldings = async () => {
    const accounts = await connection.getParsedProgramAccounts(
      TOKEN_PROGRAM_ID, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
      {
        filters: [
          {
            dataSize: 165, // number of bytes
          },
          {
            memcmp: {
              offset: 32, // number of bytes
              bytes: new web3.PublicKey(
                // "dv3qDFk1DTF36Z62bNvrCXe9sKATA6xvVy6A798xxAS"
                account?.publicKey
              ), // base58 encoded string
            },
          },
        ],
      }
    );
    accounts.map(async acc => {
      let fetchTokenInfo = await fetchTokens(acc.account.data.parsed.info.mint);

      console.log(
        fetchTokenInfo[0]?.name,
        fetchTokenInfo[0]?.symbol,
        acc.account.data.parsed.info.mint,
        acc.account.data.parsed.info.tokenAmount.uiAmount
      );
    });
    // let response = await connection.getTokenAccountsByOwner(
    //   new web3.PublicKey(account.publicKey), // owner here
    //   {
    //     programId: TOKEN_PROGRAM_ID,
    //   }
    // );
    // response.value.forEach(e => {
    //   console.log(`pubkey: ${e.pubkey.toBase58()}`);
    //   const accountInfo = splToken.AccountLayout.decode(e.account.data);
    //   console.log(`mint: ${new web3.PublicKey(accountInfo.mint)}`);
    //   console.log(
    //     `amount: ${splToken.u64.fromBuffer(accountInfo.amount)}`,
    //     accountInfo
    //   );
    // });
  };

  const airdrop = async () => {
    setAirdropLoading(true);
    const updatedBalance = await handleAirdrop(network, account);
    if (typeof updatedBalance === "number") {
      setBalance(updatedBalance);
    }
    setAirdropLoading(false);
  };

  const showModal = () => {
    setVisible(true);
  };

  const handleClose = () => {
    setVisible(false);
  };

  const createAccount = async () => {
    const account = accountFromSeed(mnemonic, 3);
    console.log(
      "ACCOUNT============",
      account.publicKey.toString(),
      b58.encode(account.secretKey)
    );
  };

  const accountFromSeed = (
    seed: string,
    walletIndex: number
    // derivationPath: string,
    // accountIndex: 0
  ) => {
    const derivedSeed = deriveSeed(
      seed,
      walletIndex
      // derivationPath,
      // accountIndex
    );
    const keyPair = nacl.sign.keyPair.fromSeed(derivedSeed);

    const acc = new Keypair(keyPair);
    return acc;
  };

  const deriveSeed = (
    seed: string,
    walletIndex: number
    // derivationPath: string,
    // accountIndex: number
  ): Buffer | undefined => {
    const path44Change = `m/44'/501'/${walletIndex}'/0'`;
    return ed25519.derivePath(path44Change, Buffer.from(seed, "hex")).key;
  };

  const displayAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <>
      {account && (
        <Dashboard>
          <h1>Dashboard</h1>
          <h2>Seed Phrase: {mnemonic}</h2>

          <Paragraph
            copyable={{ text: account.publicKey.toString(), tooltips: `Copy` }}
          >
            {`Account: ${displayAddress(account.publicKey.toString())}`}
          </Paragraph>

          <p>
            Connected to{" "}
            {network &&
              (network === "mainnet-beta"
                ? network.charAt(0).toUpperCase() + network.slice(1, 7)
                : network.charAt(0).toUpperCase() + network.slice(1))}
          </p>
          {airdropLoading ? (
            <h2>
              <LoadingOutlined spin />
            </h2>
          ) : (
            <h2>
              {balance} <span>SOL</span>
            </h2>
          )}

          {network === "devnet" && account && (
            <>
              <Airdrop onClick={airdrop}>Airdrop</Airdrop>
              <Tooltip
                title="Click to receive 1 devnet SOL into your account"
                placement={"right"}
              >
                <Question>?</Question>
              </Tooltip>
            </>
          )}

          <Button type="primary" onClick={createAccount}>
            Create Account
          </Button>

          <Link href={`/importAccount`} passHref>
            <Button type="primary">Import Account</Button>
          </Link>

          <Link href={`/transferTokens`} passHref>
            <Button type="primary">Transfer Tokens</Button>
          </Link>

          <Button type="primary" onClick={showModal}>
            Send <ArrowRightOutlined />
          </Button>

          <Drawer
            title="Send Funds"
            placement="bottom"
            onClose={handleClose}
            visible={visible}
            height={"55vh"}
          >
            <TransactionLayout />
          </Drawer>
        </Dashboard>
      )}
    </>
  );
};

export default Wallet;

// ignore note orange cinnamon fabric audit lottery feed tuna wood antique describe
