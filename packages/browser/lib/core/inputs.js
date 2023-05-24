import { constructSource, calculateHeight } from "../utils";

export default function Inputs(config) {
  return {
    generate: function (id, settings) {
      document.getElementById(id).innerHTML = `<iframe src="${constructSource(
        config,
        settings
      )}" id="ev-iframe" title="Payment details" frameborder="0" scrolling="0" height=${calculateHeight(
        settings
      )}></iframe>`;

      window.addEventListener("message", (event) => {
        if (event.origin !== config.input.inputsOrigin) return;
        if (
          settings?.height === "auto" &&
          event.data?.type === "EV_FRAME_HEIGHT"
        ) {
          document.getElementById("ev-iframe").height = event.data.height;
        }
      });

      /**
       * @type {Promise<boolean>}
       */
      const isInputsLoaded = new Promise((resolve) => {
        const elem = document.getElementById("ev-iframe");

        if (elem instanceof HTMLIFrameElement) {
          const doc = elem.contentDocument ?? elem.contentWindow.document;

          if (doc.readyState === "complete") {
            resolve(true);
          }

          const interval = setInterval(() => {
            if (doc.readyState === "complete") {
              clearInterval(interval);
              resolve(true);
            }
          }, 750);
        }
      });

      return {
        isInputsLoaded,
        getData: () =>
          new Promise((res, rej) => {
            const channel = new MessageChannel();

            channel.port1.onmessage = ({ data }) => {
              channel.port1.close();
              return res(data);
            };

            document
              .getElementById("ev-iframe")
              .contentWindow.postMessage("message", "*", [channel.port2]);
          }),
        on: (event, fn) => {
          if (event === "change") {
            window.addEventListener(
              "message",
              (event) => {
                if (event.origin !== config.input.inputsOrigin) return;
                if (event.data?.type === "EV_FRAME_HEIGHT") return;
                if (event.data?.type === "EV_FRAME_READY") return;
                fn(event.data);
              },
              false
            );
          }
        },
        setLabels: (labels) => {
          const channel = new MessageChannel();
          document
            .getElementById("ev-iframe")
            .contentWindow.postMessage(labels, "*", [channel.port2]);
        },
      };
    },
  };
}
