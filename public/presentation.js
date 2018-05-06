/* eslint-disable require-jsdoc */

class Presentation {
  constructor(page) {
    this.page = page;
    this.connection = null;

    this.presoRequest = new PresentationRequest(this.page);
    // Make this presentation the default one when using the "Cast" browser menu.
    navigator.presentation.defaultRequest = this.presoRequest;

    // window.addEventListener('beforeunload', e => {
    //   this.connection && this.connection.terminate();
    // });
  }

  async start(id = null) {
    try {
      this.connection = id ? await this.presoRequest.reconnect(id) :
        await this.presoRequest.start();
      console.log('Connected to ' + this.connection.url + ', id: ' + this.connection.id);

      this.connection.onmessage = this.onMessage.bind(this);

      this.connection.onterminate = () => {
        this.connection = null;
      };
    } catch (err) {
      console.error(err);
      throw err;
    }

    return this.connection;
  }

  stop() {
    this.connection && this.connection.terminate();
  }

  send(msg) {
    this.connection && this.connection.send(JSON.stringify(msg));
  }

  onMessage(e) {
    if (this.onmessage) {
      this.onmessage(JSON.parse(e.data));
    }
  }
}

export {Presentation};
