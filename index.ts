import { getHttpEndpoint } from "@orbs-network/ton-access";
import { Address, TonClient, TupleItem } from "@ton/ton";
import { BN } from "bn.js";
import dotenvFlow from "dotenv-flow";

dotenvFlow.config({ debug: false });

async function main() {
  const wallet = Address.parse(process.env.SC_ADDRESS!);
  const collection = Address.parse(process.env.COLL_ADDRESS!);

  const client = new TonClient({
    endpoint: await getHttpEndpoint({ network: "mainnet" }),
  });

  const mining_data = await client
    .provider(collection)
    .get("get_mining_data", []);

  const miningData: { stack: TupleItem[] } = { stack: [] };

  while (mining_data.stack.remaining > 0) {
    const item = mining_data.stack.pop();
    miningData.stack.push(item);
  }

  console.log(`StackLen: ${miningData.stack.length}`);

  const parseStackNum = (item: TupleItem) =>
    item.type === "int" ? new BN(item.value.toString(16), "hex") : new BN(0);

  const complexity = parseStackNum(miningData.stack[0]);
  const last_success = parseStackNum(miningData.stack[1]);
  const seed = parseStackNum(miningData.stack[2]);
  const target_delta = parseStackNum(miningData.stack[3]);
  const min_cpl = parseStackNum(miningData.stack[4]);
  const max_cpl = parseStackNum(miningData.stack[5]);

  console.log("complexity", complexity);
  console.log("last_success", last_success.toString());
  console.log("seed", seed);
  console.log("target_delta", target_delta.toString());
  console.log("min_cpl", min_cpl.toString());
  console.log("max_cpl", max_cpl.toString());
}

main();
