/*
 * This file is part of CycloneDX Webpack plugin.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 * Copyright (c) OWASP Foundation. All Rights Reserved.
 */
const {generateBom} = require('../bom');
const path = require('path');

/**
 * Webpack plugin for generating CycloneDX Software Bill of Materials (SBOM).
 * This will generate an SBOM of all dependencies used by webpack to link a
 * package's code with the needed dependencies. It's not unusual for the
 * SBOM to be a subset of the dependencies defined in `package.json`.
 */
class CycloneDxWebpackPlugin {
	/**
	 * CycloneDX Webpack Plugin
	 * @param {{ context: string,
	 *           outputLocation: string,
	 *           emitStats: boolean,
	 * 	         moduleName: string,
	 *           moduleVersion: string
	 *        }} param0 options for plugin execution
	 */
	constructor({
		// Default options
		context,
		moduleName,
		moduleVersion,
		outputLocation = './cyclonedx',
		includeWellknown = true,
		wellknownLocation = './.well-known',
		componentType = 'application',
		emitStats = false
	} = {}) {
		this.context = context;
		this.moduleName = moduleName;
		this.moduleVersion = moduleVersion;
		this.outputLocation = outputLocation;
		this.includeWellknown = includeWellknown;
		this.wellknownLocation = wellknownLocation;
		this.componentType = componentType;
		this.emitStats = emitStats;
	}

	// Apply the plugin to a promise hook in webpack (only available in webpack 4+)
	// Uses the emit hook because the plugin needs to generate a file after it's complete
	apply(compiler) {
		if (compiler.hooks)
			compiler.hooks.emit.tapPromise('cyclonedx-webpack-plugin', this.emitBom.bind(this));
		else
			throw new Error(`Webpack 4+ required to use ${this.constructor.name}`);
	}

	// Setup SBOM generation and emit the file
	emitBom(compilation) {
		return new Promise(async resolve => {
			try {
				const output = await generateBom({
					// Needed for inspecting the webpack code linkages
					modules: compilation.modules,
					// Context from webpack config or defaults to process.cwd()
					context: this.context || compilation.options.context,
					moduleName: this.moduleName,
					moduleVersion: this.moduleVersion,
					componentType: this.componentType
				});

				const jsonBom = path.join(this.outputLocation, './bom.json');
				const xmlBom = path.join(this.outputLocation, './bom.xml');
				const wellknownBom = path.join(this.wellknownLocation, './sbom');

				// eslint-disable-next-line no-param-reassign
				compilation.assets[jsonBom] = {
					source: () => output.toJSON(),
					size: () => output.length
				};
				// eslint-disable-next-line no-param-reassign
				compilation.assets[xmlBom] = {
					source: () => output.toXML(),
					size: () => output.length
				};
				if (this.includeWellknown) {
					// eslint-disable-next-line no-param-reassign
					compilation.assets[wellknownBom] = {
						source: () => output.toJSON(),
						size: () => output.length
					};
				}

				// emit webpack's stats if they were requested
				if (this.emitStats) {
					const jsonDevModules = JSON.stringify(compilation.getStats().toJson({
						chunkModules: true
					}), null, 2);
					const statsFilePath = path.join(this.outputLocation, './stats.json');
					// this is how the webpack documentation says to emit files.
					// eslint-disable-next-line no-param-reassign
					compilation.assets[statsFilePath] = {
						source: () => jsonDevModules,
						size: () => jsonDevModules.length
					};
				}
			} catch (err) {
				// Catch all errors and log it. This plugin shouldn't block the build process.
				// eslint-disable-next-line no-console
				console.error(err);
			}
			// Tell webpack the plugin is done.
			resolve();
		});
	}
}

module.exports = {CycloneDxWebpackPlugin};
