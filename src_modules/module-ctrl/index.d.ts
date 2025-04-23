export declare const cpModule: (sourcePath: string, targetPath: string) => Promise<void>;

/**
 * 将项目内的所有src_module从node_modules复制到src_modules
 * @param projectPath
 * @returns
 */
export declare const cpModulesToSrc: (projectPath: string) => Promise<void[]>;

/**
 * 将项目的指定模块复制到src_modules
 * @param projectPath 项目地址
 * @param moduleName 模块名称
 */
export declare const cpSpecificSrcmodule: (projectPath: string, moduleName: string) => Promise<void>;

export declare const depKeys: string[];

/**
 * 获取当前模块的esm路径：file:///
 * @param path 需要转换的路径
 * @returns
 */
export declare const getEsmPath: (path: string) => string;

/**
 * 获取当前模块路径
 * @param meta import.meta
 * @returns
 */
export declare const getFileDirPath: (meta: Meta) => string;

/**
 * 获取当前模块路径,取决于调用所在的文件，build之后，会指向build后的文件
 * @description 所以如无必要，不推荐build，可能导致开发和生产环境路径不一致
 * @param meta import.meta
 * @returns
 */
export declare const getFilePath: (meta: Meta) => string;

/**
 * 判断项目是否为SrcModule
 * @param info packageJsonData
 * @returns
 */
declare function getIsSrcModuleByPackageInfo(info: false | Record<string, any>): boolean;

/**
 * 获取当前模块root目录
 * @returns
 */
export declare const getRootDirname: () => string;

export declare interface Meta {
    url: string;
}

export declare type ModuleDeps = Record<string, Array<string>>;

export declare type ModuleItem = {
    /** 模块名称 */
    name: string;
    /** 相对路径 */
    src: string;
    /** 版本 */
    version: string;
    /** 文件路径 */
    fileUrl: string;
    /** 完整的package.json信息 */
    packageInfo: Record<string, any>;
    /** 是否时srcmodule */
    isSrcModule: boolean;
    /** 是否是根目录 */
    isRoot?: boolean;
};

export declare type ModuleMap = Record<string, ModuleItem>;

/**
 * SrcModule信息查询
 * ```json
 // SrcModule规范
 // package.json
 {
 "platform": "node", // "web" | "node" 平台类型，可选值为 "web" 或 "node"
 "srcModule": {
 "isRoot": true, // 是否是根目录，布尔值
 "buildType": false, //  false | "lib" | "web-app" 构建类型，"web-app" 会注入 HTML，默认值为 false（不需要打包）,目前仅支持'web'|false
 "outputDir": "./dist", // 默认输出路径，用于指定创建导出文件时的默认配置，默认值为 "./dist"
 "srcDir": "./src", // 源代码目录路径，用于指定创建导出文件时的默认配置，默认值为 "./src"
 "dist": {
 ".": "./index.ts", // 主入口文件路径
 "./Xxx": "./xx.ts" // 其他导出文件路径
 },
 // 未实现, 源码仓库和版本管理
 "repo": {
 "origin": {
 "remote": "xxx", // 远程仓库地址
 "modulePath": "./", // 模块路径
 "vcs": "git", // 版本控制系统类型
 "versions": {
 "1.0.0": "67f66bc7069d7" // 版本号与对应的提交哈希值
 }
 }
 },
 "curentRepo": "origin", // 当前使用的仓库名称
 "versions": ["1.0.0"] // 可用的版本列表
 }
 }
 ```
 */
export declare class SrcModuleInfo {
    static SRC_MODULES: string;
    /**
     * 获取项目信息，包含当前项目, 以及SrcModule的子项目
     * @param projectPath
     * @returns
     */
    static getCurrentSrcModulesInfo: (projectPath: string) => Promise<{
        moduleMap: ModuleMap;
        dependencyMap: ModuleDeps;
    }>;
    /**
     * 【工厂函数】创建一个函数：获取到指定路径的相对路径
     * @param projectPath
     * @returns
     */
    static formatPath_Creator: (projectPath: string) => {
        toWrite: (src: string) => string;
        toSystem: (relativeSrc: string) => string;
    };
    static isNodeModule: (filePath: string) => Promise<boolean>;
    /**
     * 判断项目是否为SrcModule
     * @param filePath
     * @returns
     */
    static isSrcModule: (filePath: string) => Promise<boolean>;
    /**
     * 获取项目是否为SrcModule
     * @param info packageJsonData
     * @returns
     */
    static getIsSrcModuleByPackageInfo: typeof getIsSrcModuleByPackageInfo;
    /**
     * 返回node_nodules的package信息, 如果不是node_modules则返回false
     * @param projectPath 项目文件夹
     * @returns
     */
    static readPackageInfo: (projectPath: string) => Promise<false | Record<string, any>>;
    /**
     * 是否为无修改包,仅对已经是源代码的资源进行判断
     * @param packagePath 包路径
     * @returns
     */
    static isCleanPackage: (packagePath: string) => Promise<boolean>;
    /**
     * 是否需要build
     * @param pkgInfo
     * @returns
     */
    static isNeedBuild: (pkgInfo: false | Record<string, any>) => any;
    /**
     * 获取输出路径
     * @param pkgInfo
     * @returns
     */
    static getOutputDir: (pkgInfo: Record<string, any>) => any;
    /**
     * 获取Src路径
     * @param pkgInfo
     * @returns
     */
    static getSrcDir: (pkgInfo: Record<string, any>) => any;
    /**
     * 获取模块主Src路径
     * @param pkgInfo
     * @returns
     */
    static getMainSrc: (pkgInfo: Record<string, any>) => any;
    /**
     * 通过pkgInfo 获取模块打包信息
     * @param pkgInfo
     * @returns
     */
    static getBuildConfigByPkgInfo(pkgInfo: Record<string, any>): {
        input: {
            name: string;
            key: string;
            src: any;
        };
        output: {
            import: any;
            require: any;
            types: any;
        };
    }[];
}

/**
 * 为SrcModule更新package.json信息
 */
export declare const updatePackageInfoForSrcModule: (projectPath: string) => Promise<void>;

/**
 * 把windows path 转为linux path
 * @param windowsPath
 * @param strongRelative 强制附加 "./"|"../"
 * @returns
 */
export declare function windowsPathToLinuxPath(windowsPath: string, strongRelative?: boolean): string;

export { }
