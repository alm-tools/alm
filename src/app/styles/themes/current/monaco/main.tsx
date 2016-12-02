"use strict";
import * as typestyle from 'typestyle';
import * as csx from '../../../../base/csx';
import * as baseStyles from "../base";

/**
 * Change the default font.
 * The default is `consolas` , `courier new`.
 * This means that if user does not have consolas they get *aweful* courier new.
 * Don't want that.
 * Also the default change by OS.
 * I prefer consistency so going with custom font everywhere
 */
export let fontFamily = 'Menlo, Monaco, Courier New, monospace';

/** Also make the font a bit bigger */
export let fontSize = 12;
