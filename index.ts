import { getHttpEndpoint } from "@orbs-network/ton-access";
import { Address, TonClient, TupleItem } from "@ton/ton";
import { BN } from "bn.js";
import dotenvFlow from "dotenv-flow";
import { Address as AddressTon } from "ton";
import { MineMessageParams, Queries } from "./src/giver/NftGiver.data";
import { unixNow } from "./src/lib/utils";

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

  const mineParams: MineMessageParams = {
    expire: unixNow() + 300, // 5 min is enough to make a transaction
    mintTo: AddressTon.parse(process.env.SC_ADDRESS!), // your wallet
    data1: new BN(0), // temp variable to increment in the miner
    seed, // unique seed from get_mining_data
  };

  let msg = Queries.mine(mineParams); // transaction builder

  let progress = 0;

  while (new BN(msg.hash(), "be").gt(complexity)) {
    progress += 1;
    console.clear();
    console.log(
      `Mining started: please, wait for 30-60 seconds to mine your NFT!`
    );
    console.log(" ");
    console.log(
      `⛏ Mined ${progress} hashes! Last: `,
      new BN(msg.hash(), "be").toString()
    );

    mineParams.expire = unixNow() + 300;
    mineParams.data1.iaddn(1);
    msg = Queries.mine(mineParams);
  }

  console.log(" ");
  console.log("💎 Mission completed: msg_hash less than pow_complexity found!");
  console.log(" ");
  console.log("msg_hash: ", new BN(msg.hash(), "be").toString());
  console.log("pow_complexity: ", complexity.toString());
  console.log(
    "msg_hash < pow_complexity: ",
    new BN(msg.hash(), "be").lt(complexity)
  );
}

main();
