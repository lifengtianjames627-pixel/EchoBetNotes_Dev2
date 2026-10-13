import "server-only";
import { client } from "./client";
import { assertDatabaseAcceptsSelectOne } from "./select-one";

export async function pingProcessDatabase(): Promise<void> {
  await assertDatabaseAcceptsSelectOne(client);
}
