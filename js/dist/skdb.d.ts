declare class SKDBCallable<T1, T2> {
    private id;
    constructor(id: number);
    getId(): number;
}
export declare class SKDB {
    private subscriptionCount;
    private args;
    private current_stdin;
    private stdin;
    private stdout;
    private onRootChangeFuns;
    private externalFuns;
    private fileDescrs;
    private fileDescrNbr;
    private files;
    private changed_files;
    private execOnChange;
    private servers;
    private lineBuffer;
    private storeName;
    private nbrInitPages;
    private rootsAreInitialized;
    private roots;
    private pageSize;
    private db;
    private dirtyPagesMap;
    private dirtyPages;
    private working;
    private mirroredTables;
    private exports;
    private constructor();
    static create(reboot: boolean): Promise<SKDB>;
    setMirroredTable(tableName: string, sessionID: number): void;
    attach(f: (change: string) => void): void;
    connect(uri: string, db: string, user: string, password: string): Promise<number>;
    server(serverID?: number): SKDBServer;
    private makeWasmImports;
    private storePages;
    private runAddRoot;
    runLocal(new_args: Array<string>, new_stdin: string): string;
    runSubscribeRoots(): void;
    connectReadTable(uri: string, db: string, user: string, password: string, tableName: string, suffix: string): Promise<number>;
    connectWriteTable(uri: string, user: string, password: string, tableName: string): Promise<(txt: string) => void>;
    getSessionID(tableName: string): number;
    cmd(new_args: Array<string>, new_stdin: string): string;
    registerFun<T1, T2>(f: (obj: T1) => T2): SKDBCallable<T1, T2>;
    trackedCall<T1, T2>(callable: SKDBCallable<T1, T2>, arg: T1): T2;
    trackedQuery(request: string, start?: number, end?: number): any;
    onRootChange(f: (rootName: string) => void): void;
    addRoot<T1, T2>(rootName: string, callable: SKDBCallable<T1, T2>, arg: T1): void;
    removeRoot(rootName: string): void;
    getRoot(rootName: string): any;
    subscribe(viewName: string, f: (change: string) => void): void;
    sqlRaw(stdin: string): string;
    sql(stdin: string): Array<any>;
    insert(tableName: string, values: Array<any>): void;
    private getID;
}
declare class SKDBServer {
    private client;
    private serverID;
    private uri;
    private db;
    private user;
    private password;
    private userID;
    private sessionID;
    constructor(client: SKDB, serverID: number, uri: string, db: string, user: string, password: string, userID: number, sessionID: number);
    sqlRaw(passwd: string, stdin: string): Promise<string>;
    sql(passwd: string, stdin: string): Promise<any[]>;
    mirrorTable(tableName: string): Promise<void>;
    mirrorView(tableName: string, suffix?: string): Promise<void>;
}
export {};
//# sourceMappingURL=skdb.d.ts.map