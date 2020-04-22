export interface PromiseDeferInterface<T> {
  // 对应的promise方法
  promise: Promise<T>;
  // 对应的resolve方法
  resolve: (it?: T) => void;
  // reject的错误信息
  reject: (it: any) => void;
}
