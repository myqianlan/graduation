#简单构思
###是一个基于websocket的多人实时在线技术
###多客户端实时展现各项改变
###node.js处理后端逻辑
###socket.io作为实时通讯框架
###后期考虑多终端的适配，比如基本的多显示尺寸以及不同的交互方式（比如触摸屏）
###动态显示当前连接的客户端数量
###客户端可以一次发送多个数据点。设置一个开关，默认关闭，每次点击就会绽放一个烟花实例，并传递给其他客户端；开启这个开关，用户可以一次性绘制多个点，该点不是烟花绽放的命令，而是记录一个位置，将这些点放进一个数组进行传递，然后点击发送，和其他客户端一次性绘制这些数据点的烟花，可以产生一些好玩的东西。
###构思一个有创意的文案