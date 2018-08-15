// Type definitions for Smoothie Charts 1.35
// Project: https://github.com/joewalnes/smoothie
// Definitions by: Drew Noakes <https://drewnoakes.com>
//                 Mike H. Hawley <https://github.com/mikehhawley>

export interface ITimeSeriesOptions {
    resetBounds?: boolean;
    resetBoundsInterval?: number;
}

export interface ITimeSeriesPresentationOptions {
    strokeStyle?: string;
    fillStyle?: string;
    lineWidth?: number;
    tooltipLabel?: string;
}

export declare class TimeSeries {
    /**
     * Initialises a new <code>TimeSeries</code> with optional data options.
     *
     * Options are of the form (defaults shown):
     *
     * <pre>
     * {
     *   resetBounds: true,        // enables/disables automatic scaling of the y-axis
     *   resetBoundsInterval: 3000 // the period between scaling calculations, in millis
     * }
     * </pre>
     *
     * Presentation options for TimeSeries are specified as an argument to <code>SmoothieChart.addTimeSeries</code>.
     */
    constructor(options?: ITimeSeriesOptions);

    /**
     * Adjust or inspect the lower y-axis for this <code>TimeSeries</code> object.
     */
    minValue: number;

    /**
     * Adjust or inspect the upper y-axis for this <code>TimeSeries</code> object.
     */
    maxValue: number;

    /**
     * Hide this <code>TimeSeries</code> object in the chart.
     */
    disabled: boolean;

    /**
     * Clears all data and state from this TimeSeries object.
     */
    clear(): void;

    /**
     * Recalculate the min/max values for this <code>TimeSeries</code> object.
     *
     * This causes the graph to scale itself in the y-axis.
     */
    resetBounds(): void;

    /**
     * Adds a new data point to the <code>TimeSeries</code>, preserving chronological order.
     *
     * @param timestamp the position, in time, of this data point
     * @param value the value of this data point
     * @param sumRepeatedTimeStampValues if <code>timestamp</code> has an exact match in the series, this flag controls
     * whether it is replaced, or the values summed (defaults to false.)
     */
    append(timestamp: number, value: number, sumRepeatedTimeStampValues?: boolean): void;

    dropOldData(oldestValidTime: number, maxDataSetLength: number): void;
}

export interface IGridOptions {
    /** The background colour of the chart. */
    fillStyle?: string;
    /** The pixel width of grid lines. */
    lineWidth?: number;
    /** Colour of grid lines. */
    strokeStyle?: string;
    /** Distance between vertical grid lines. */
    millisPerLine?: number;
    /** Controls whether grid lines are 1px sharp, or softened. */
    sharpLines?: boolean;
    /** Number of vertical sections marked out by horizontal grid lines. */
    verticalSections?: number;
    /** Whether the grid lines trace the border of the chart or not. */
    borderVisible?: boolean;
}

export interface ILabelOptions {
    /** Enables/disables labels showing the min/max values. */
    disabled?: boolean;
    /** Colour for text of labels. */
    fillStyle?: string;
    fontSize?: number;
    fontFamily?: string;
    precision?: number;
    /** Shows intermediate labels between min and max values along y axis. */
    showIntermediateLabels?: boolean;
    intermediateLabelSameAxis?: boolean;
}

export interface ITitleOptions {
    /** The text to display on the left side of the chart. Defaults to "". */
    text?: string;
    /** Colour for text. */
    fillStyle?: string;
    fontSize?: number;
    fontFamily?: string;
    /** The vertical position of the text. Defaults to "middle". */
    verticalAlign?: "top" | "middle" | "bottom";
}

export interface IRange { min: number; max: number }

export interface IHorizontalLine {
    value?: number;
    color?: string;
    lineWidth?: number;
}

export interface IChartOptions {
    /** Specify to clamp the lower y-axis to a given value. */
    minValue?: number;
    /** Specify to clamp the upper y-axis to a given value. */
    maxValue?: number;
    /** Allows proportional padding to be added above the chart. For 10% padding, specify 1.1. */
    minValueScale?: number;
    /** Allows proportional padding to be added below the chart. For 10% padding, specify 1.1. */
    maxValueScale?: number;
    yRangeFunction?: (range: IRange) => IRange;
    /** Controls the rate at which y-value zoom animation occurs. */
    scaleSmoothing?: number;
    /** Sets the speed at which the chart pans by. */
    millisPerPixel?: number;
    /** Whether to render at different DPI depending upon the device. Enabled by default. */
    enableDpiScaling?: boolean;
    /** Callback function that formats the min y value label */
    yMinFormatter?: (min: number, precision: number) => string;
    /** Callback function that formats the max y value label */
    yMaxFormatter?: (max: number, precision: number) => string;
    /** Callback function that formats the intermediate y value labels */
    yIntermediateFormatter?: (intermediate: number, precision: number) => string;
    maxDataSetLength?: number;
    /** Controls how lines are drawn between data points. Defaults to "bezier". */
    interpolation?: "linear" | "step" | "bezier";
    /** Optional function to format time stamps for bottom of chart. You may use <code>SmoothieChart.timeFormatter</code>, or your own/ */
    timestampFormatter?: (date: Date) => string;
    horizontalLines?: IHorizontalLine[];

    grid?: IGridOptions;

    labels?: ILabelOptions;

    title?: ITitleOptions;

    tooltip?: boolean;
    tooltipLine?: { lineWidth: number, strokeStyle: string };
    tooltipFormatter?: (timestamp: number, data: {series: TimeSeries, index: number, value: number}[]) => string;

    /** Whether to use time of latest data as current time. */
    nonRealtimeData?: boolean;

    /**
     * Displays not the latest data, but data from the given percentile.
     * Useful when trying to see old data saved by setting a high value for maxDataSetLength.
     * Should be a value between 0 and 1.
     */
    displayDataFromPercentile?: number;

    /** Allows the chart to stretch according to its containers and layout settings. Default is <code>false</code>, for backwards compatibility. */
    responsive?: boolean;

    /** The maximum frame rate the chart will render at, in FPS. Default is <code>0</code>, meaning no limit. */
    limitFPS?: number;
}

/**
 * Initialises a new <code>SmoothieChart</code>.
 *
 * Options are optional and may be sparsely populated. Just specify the values you
 * need and the rest will be given sensible defaults.
 */
export declare class SmoothieChart {
    constructor(chartOptions?: IChartOptions);

    /**
     * Change or inspect presentation options.
     */
    options: IChartOptions;

    /**
     * Adds a <code>TimeSeries</code> to this chart, with optional presentation options.
     */
    addTimeSeries(series: TimeSeries, seriesOptions?: ITimeSeriesPresentationOptions): void;

    /**
     * Removes the specified <code>TimeSeries</code> from the chart.
     */
    removeTimeSeries(series: TimeSeries): void;

    /**
     * Gets render options for the specified <code>TimeSeries</code>.
     *
     * As you may use a single <code>TimeSeries</code> in multiple charts with different formatting in each usage,
     * these settings are stored in the chart.
     */
    getTimeSeriesOptions(timeSeries: TimeSeries): ITimeSeriesPresentationOptions;

    /**
     * Brings the specified <code>TimeSeries</code> to the top of the chart. It will be rendered last.
     */
    bringToFront(timeSeries: TimeSeries): void;

    /**
     * Instructs the <code>SmoothieChart</code> to start rendering to the provided canvas, with specified delay.
     *
     * @param canvas the target canvas element
     * @param delayMillis an amount of time to wait before a data point is shown. This can prevent the end of the series
     * from appearing on screen, with new values flashing into view, at the expense of some latency.
     */
    streamTo(canvas: HTMLCanvasElement, delayMillis?: number): void;

    /**
     * Starts the animation of this chart. Called by <code>streamTo</code>.
     */
    start(): void;

    /**
     * Stops the animation of this chart.
     */
    stop(): void;

    updateValueRange(): void;

    render(canvas?: HTMLCanvasElement, time?: number): void;

    static timeFormatter(date: Date): string;
}
