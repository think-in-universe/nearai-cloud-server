export async function sleep(timeout: number) {
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), timeout);
  });
}
