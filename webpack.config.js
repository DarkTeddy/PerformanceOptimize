const path = require('path');
const Webpack = require('webpack');
const friendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');
const notifier = require('node-notifier')
const speedMeasureWebpackPlugin = require('speed-measure-webpack-v5-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const ImageMiniMizerOlugin = require('image-minimizer-webpack-plugin');

// cross-env 跨平台设置和使用环境变量
// windows: set NODE_ENV=production
// mac: export NODE_ENV=production

const smww = new speedMeasureWebpackPlugin();
// 性能优化第二条
const bootstrap = path.resolve(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.css')

module.exports = smww.wrap({
    mode: 'none',
    devtool: 'source-map',
    context: process.cwd(),
    entry: {
        main: './src/main.js'
    },
    // 性能优化第十条（本条开始均为客户端优化），添加压缩代码的配置
    optimization: {
        minimize: true,
        minimizer: [
            // 性能优化第十条：js的代码压缩
            new TerserPlugin({
                // parallel: true // 开启多线程压缩（除非非常大才会开启）
                extractComments: false, // 不生成license.txt文件
                terserOptions: {
                    compress: {
                        drop_console: true, // 删除console
                        drop_debugger: true, // 删除debugger
                    }
                }
            }),
            // 性能优化第十一条，图片资源的压缩
            new ImageMiniMizerOlugin({
                minimizer: {
                    implementation: ImageMiniMizerOlugin.sharpMinify,
                    options: {
                        encodeOptions: {
                            jpeg: {
                                quality: 80, // 设置jpeg图像的质量
                            },
                            png: {
                                compressionLevel: 9, // 设置png图像的压缩级别
                            },
                            webp: {
                                quality: 80, // 设置webp图像的质量
                            },
                            avif: {
                                quality: 50, // 设置avif图像的质量
                            },
                        }
                    }
                }
            }),
        ]
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                // 性能优化第九条，添加缓存机制
                use: ['cache-loader','style-loader', 'css-loader', 'logger-loader'],
            },
            {
                test: /\.js$/,
                use: [
                    // 性能优化第八条，开启多线程（但是注意，开多线程和线程通信都要时间，除非是很大项目否则不开）
                    // {
                    //     loader: 'thread-loader',
                    //     options: {
                    //         workers: 3,
                    //     }
                    // },
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env'],
                            cacheDirectory: true,
                        }
                    },
                    'cache-loader',
                ]
            },
        ],
        noParse: path.resolve(__dirname, 'src/title'),
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Webpack Plugin Sample',
            template: './src/index.html',
        }),
        new friendlyErrorsWebpackPlugin({
            onErrors: (severity, errors) => {
                notifier.notify({
                    title: 'Webpack Error',
                    message: `${severity}: ${errors[0].name}`,
                    subtitle: errors[0].file || ''
                })
            }
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'disabled',
            generateStatsFile: true,
        }),
        // 性能优化第七条，减少不必要的库引入
        new Webpack.IgnorePlugin({
            resourceRegExp: /^\.\/locale$/,
            contextRegExp: /moment$/,
        }),
        // 性能优化第十条，压缩css代码
        new OptimizeCssAssetsWebpackPlugin(),
    ],
    resolve: {
        // 性能优化第一条：缩短文件后缀的查询
        extensions: ['.js', '.json'],
        // 性能优化第二条，如果引入一个大的包，比如bootstrap
        // 并不需要全部功能，而只需要引入css样式，就可以指定模块别名
        alias: {bootstrap},
        // 性能优化第三条，限定在哪里寻找模块，默认是找每一层的node_modules，直到文件系统根目录
        // 下面这条语句指定了只在当前项目根目录的node_modules中去找，不会再一层一层往上去找了
        modules: [path.resolve(__dirname, 'node_modules')],
        // 性能优化第四条，指定入口文件
        mainFields: ['browser', 'module', 'main'],
        // 性能优化第四条，对没有package.json的第三方文件，指定其入口目录
        mainFiles: ['index'],// 如果目录下没有package.json文件，默认使用index.js文件

    },
    externals: {
        // 性能优化五，jquery如果直接导入包很大，此处标记意味着防止将jquery的包打包到bundle中，而是在运行时再去从外部获取这些扩展依赖
        // 例如可以在index.html中通过CDN引入jquery,<script src="https://code.jquery.com/jquery-3.1.0.js"></script>
        jquery: 'jQuery',
    },
    resolveLoader: {
        // 性能优化第六条，可以指定loader的寻找范围，如果在node_modules里面没找到，就不用一级一级找了，直接去loaders里面找就行了
        modules: ['node_modules', './loaders'],
    },
})