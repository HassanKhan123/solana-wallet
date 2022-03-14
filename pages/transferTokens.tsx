import React, { useEffect } from "react";
import * as web3 from "@solana/web3.js";
import { NextPage } from "next";
import * as splToken from "@solana/spl-token";

import { useGlobalState } from "../context";

let connection;

const transferTokens = () => {
  const { account } = useGlobalState();
  useEffect(() => {
    connection = new web3.Connection(web3.clusterApiUrl("devnet"), "confirmed");
  }, []);

  const USDC_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
  var myMint = new web3.PublicKey(USDC_ADDRESS);
  useEffect(() => {
    (async () => {
      try {
        let fromWallet = account;
        let toWallet = web3.Keypair.generate();
        //         // Construct my token class
        let USDC_pubkey = new web3.PublicKey(USDC_ADDRESS);
        console.log("PUBLI------------", fromWallet, toWallet);

        var myToken = new splToken.Token(
          connection,
          USDC_pubkey,
          splToken.TOKEN_PROGRAM_ID,
          fromWallet
        );

        var fromTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
          fromWallet.publicKey
        );
        var toTokenAccount = await myToken.getOrCreateAssociatedAccountInfo(
          toWallet.publicKey
        );
        // //         // Create associated token accounts for my token if they don't exist yet
        var transaction = new web3.Transaction().add(
          splToken.Token.createTransferInstruction(
            splToken.TOKEN_PROGRAM_ID,
            fromTokenAccount.address,
            toTokenAccount.address,
            fromWallet.publicKey,
            [],
            10
          )
        );
        // Sign transaction, broadcast, and confirm
        var signature = await web3.sendAndConfirmTransaction(
          connection,
          transaction,
          [fromWallet]
        );
        console.log("SIGNATURE", signature);
        console.log("SUCCESS");
      } catch (error) {
        console.log("ERROR=============", error);
      }
    })();
  }, [account]);

  return <div>transferTokens</div>;
};

export default transferTokens;
