const primitives = {
  state: {},
  update(upstreamState) {
    this.state = "new primitives state";
  },
};

export default primitives;
