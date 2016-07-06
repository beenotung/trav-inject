/**
 * Created by beenotung on 7/6/16.
 */
module model {
  export class Animal {
    think() {
      return "... (unknown meaning)"
    }

    say() {
      console.log(this.think());
    }
  }
}
