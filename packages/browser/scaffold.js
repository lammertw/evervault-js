import Evervault from "./lib/main";

(async () => {
  var evervault = new Evervault(
    import.meta.env.VITE_EV_TEAM_UUID,
    import.meta.env.VITE_EV_APP_UUID
  );
  console.log(await evervault.encrypt("hello evervault"));

  const inputs = evervault.inputs("ev-inputs");

  const hook = inputs.on("change", async (encryptedCardData) => {
    console.log(encryptedCardData);
  });

  inputs.isInputsLoaded.then((isLoaded) => {
    if (isLoaded) {
      console.log("Inputs loaded");
    }
  });
})();
