import React, { useEffect, useState } from "react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { Form, Input, Button } from "antd";
import { useGlobalState } from "../context";
import { LoadingOutlined } from "@ant-design/icons";
import styled from "styled-components";
import b58 from "b58";
import { Keypair } from "@solana/web3.js";
import { refreshBalance } from "../utils";

// Import Bip39 to convert a phrase to a seed:

// Import the Keypair class from Solana's web3.js library:

const ImportAccount: NextPage = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [form] = Form.useForm();
  const router = useRouter();

  const { account, setAccount } = useGlobalState();

  // *Step 6*: implement a function that recovers an account based on a mnemonic phrase
  const handleImport = async (values: any) => {
    setLoading(true);

    const address = b58.decode(values.secret);
    console.log("ADD=========", address);
    const account = Keypair.fromSecretKey(address);

    console.log(account.publicKey.toString());
    console.log("BAL======", await refreshBalance("devnet", account));
    setLoading(false);
  };

  return (
    <>
      <h1 className={"title"}>Import Wallet</h1>

      <p>Enter your private key here to restore your account.</p>

      <StyledForm
        form={form}
        layout="vertical"
        autoComplete="off"
        requiredMark={false}
        onFinish={handleImport}
      >
        <div style={{ overflow: "hidden" }}>
          <Form.Item
            name="secret"
            label="Secret Key"
            // rules={[
            //   {
            //     required: true,
            //     message: "Please enter your secret key",
            //   },
            //   {
            //     validator(_, value) {
            //       if (value.trim().split(" ").length === 12) {
            //         return Promise.resolve();
            //       }
            //       return Promise.reject(new Error("Invalid priate key"));
            //     },
            //   },
            // ]}
          >
            <Input
              placeholder="Paste secret key from clipboard"
              style={{ minWidth: "500px" }}
            />
          </Form.Item>
        </div>

        {!loading && (
          <Form.Item shouldUpdate className="submit">
            {() => (
              <Button
                htmlType="submit"
                disabled={
                  !form.isFieldsTouched(true) ||
                  form.getFieldsError().filter(({ errors }) => errors.length)
                    .length > 0
                }
              >
                Import
              </Button>
            )}
          </Form.Item>
        )}

        {loading && <LoadingOutlined style={{ fontSize: 24 }} spin />}
      </StyledForm>
    </>
  );
};

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export default ImportAccount;
