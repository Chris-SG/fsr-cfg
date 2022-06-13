


const waitFor = (cond: Function, delay = 10) => {
    const poll = (resolve: Function) => {
        if (cond()) resolve();
        else setTimeout(() => poll(resolve), delay); 
    }
    return new Promise(poll);
}

export { waitFor };
