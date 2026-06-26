import { Connection, PublicKey } from "@solana/web3.js";

export const BRIDLE_TOKEN_MINT = "4i52FSf22KYBU8424Z2AGmJNG299jQhxM74YK1Espump";
export const BRIDLE_HOLDER_MIN_BALANCE = 1000;
export const BRIDLE_PRIORITY_BOOST = 12;

export async function getBridleTokenBalance(connection: Connection, owner: PublicKey) {
  const mint = new PublicKey(BRIDLE_TOKEN_MINT);
  const accounts = await connection.getParsedTokenAccountsByOwner(owner, {
    mint
  });

  return accounts.value.reduce((total, account) => {
    const tokenAmount = account.account.data.parsed.info.tokenAmount;
    const amount = Number(tokenAmount.uiAmountString || tokenAmount.uiAmount || 0);

    return total + amount;
  }, 0);
}
