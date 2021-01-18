export default function schedule(callback: () => void): void {
  Promise.resolve()
    .then(callback)
    .catch(error => {
      setTimeout(() => {
        throw error;
      });
    });
}
