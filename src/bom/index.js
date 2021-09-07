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
const {resolveComponents} = require('../webpack-plugin/bomGenerator');

/**
 * Main entry to process webpack module information and generate the resulting SBOM.
 * @param {{
 *            modules: any[],
 *            context: string,
 *        }} param0
 * @returns {any} final Bom object
 */
const generateBom = async ({
	modules,
	context,
	moduleName,
	moduleVersion,
	componentType,
}) => {
	const defaultModule = {moduleName, moduleVersion, componentType};
	return resolveComponents(modules, defaultModule);
};


module.exports = {generateBom};
