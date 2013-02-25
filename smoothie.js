// MIT License:
//
// Copyright (c) 2010-2011, Joe Walnes
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

/**
 * Smoothie Charts - http://smoothiecharts.org/
 * (c) 2010-2012, Joe Walnes
 *
 * v1.0: Main charting library, by Joe Walnes
 * v1.1: Auto scaling of axis, by Neil Dunn
 * v1.2: fps (frames per second) option, by Mathias Petterson
 * v1.3: Fix for divide by zero, by Paul Nikitochkin
 * v1.4: Set minimum, top-scale padding, remove timeseries, add optional timer to reset bounds, by Kelley Reynolds
 * v1.5: Set default frames per second to 50... smoother.
 *       .start(), .stop() methods for conserving CPU, by Dmitry Vyal
 *       options.interpolation = 'bezier' or 'line', by Dmitry Vyal
 *       options.maxValue to fix scale, by Dmitry Vyal
 * v1.6: minValue/maxValue will always get converted to floats, by Przemek Matylla
 * v1.7: options.grid.fillStyle may be a transparent color, by Dmitry A. Shashkin
 *       Smooth rescaling, by Kostas Michalopoulos
 * v1.8: Set max length to customize number of live points in the dataset with options.maxDataSetLength, by Krishna Narni
 * v1.9: Display timestamps along the bottom, by Nick and Stev-io
 *       (https://groups.google.com/forum/?fromgroups#!topic/smoothie-charts/-Ywse8FCpKI%5B1-25%5D)
 *       Refactored by Krishna Narni, to support timestamp formatting function
 * v1.10: Switch to requestAnimationFrame, removed the now obsoleted options.fps, by Gergely Imreh
 * v1.11: options.grid.sharpLines option added, by @drewnoakes
 *        Addressed warning seen in Firefox when seriesOption.fillStyle undefined, by @drewnoakes
 * v1.12: Support for horizontalLines added, by @drewnoakes
 *        Support for yRangeFunction callback added, by @drewnoakes
 */

function TimeSeries(options) {
  options = options || {};
  options.resetBoundsInterval = options.resetBoundsInterval || 3000; // Reset the max/min bounds after this many milliseconds
  options.resetBounds = options.resetBounds === undefined ? true : options.resetBounds; // Enable or disable the resetBounds timer
  this.options = options;
  this.data = [];
  
  this.maxValue = Number.NaN; // The maximum value ever seen in this time series.
  this.minValue = Number.NaN; // The minimum value ever seen in this time series.

  // Start a resetBounds Interval timer desired
  if (options.resetBounds) {
    this.boundsTimer = setInterval((function(thisObj) { return function() { thisObj.resetBounds(); } })(this), options.resetBoundsInterval);
  }
}

// Reset the min and max for this timeseries so the graph rescales itself
TimeSeries.prototype.resetBounds = function() {
  this.maxValue = Number.NaN;
  this.minValue = Number.NaN;
  for (var i = 0; i < this.data.length; i++) {
    this.maxValue = !isNaN(this.maxValue) ? Math.max(this.maxValue, this.data[i][1]) : this.data[i][1];
    this.minValue = !isNaN(this.minValue) ? Math.min(this.minValue, this.data[i][1]) : this.data[i][1];
  }
};

TimeSeries.prototype.append = function(timestamp, value) {
  this.data.push([timestamp, value]);
  this.maxValue = !isNaN(this.maxValue) ? Math.max(this.maxValue, value) : value;
  this.minValue = !isNaN(this.minValue) ? Math.min(this.minValue, value) : value;
};

function SmoothieChart(options) {
  // Defaults
  options = options || {};
  options.grid = options.grid || {};
  options.grid.fillStyle = options.grid.fillStyle || '#000000';
  options.grid.strokeStyle = options.grid.strokeStyle || '#777777';
  options.grid.lineWidth = typeof(options.grid.lineWidth) === 'undefined' ? 1 : options.grid.lineWidth;
  options.grid.sharpLines = !!options.grid.sharpLines;
  options.grid.millisPerLine = options.grid.millisPerLine || 1000;
  options.grid.verticalSections = typeof(options.grid.verticalSections) === 'undefined' ? 2 : options.grid.verticalSections;
  options.millisPerPixel = options.millisPerPixel || 20;
  options.maxValueScale = options.maxValueScale || 1;
  // NOTE there are no default values for 'minValue' and 'maxValue'
  options.labels = options.labels || { fillStyle:'#ffffff' };
  options.interpolation = options.interpolation || "bezier";
  options.scaleSmoothing = options.scaleSmoothing || 0.125;
  options.maxDataSetLength = options.maxDataSetLength || 2; 
  options.timestampFormatter = options.timestampFormatter || null;
  options.horizontalLines = options.horizontalLines || [];
  this.options = options;
  this.seriesSet = [];
  this.currentValueRange = 1;
  this.currentVisMinValue = 0;
}

// Based on http://inspirit.github.com/jsfeat/js/compatibility.js
SmoothieChart.AnimateCompatibility = (function() {
  var lastTime = 0,

  requestAnimationFrame = function(callback, element) {
    var requestAnimationFrame =
      window.requestAnimationFrame        ||
      window.webkitRequestAnimationFrame  ||
      window.mozRequestAnimationFrame     ||
      window.oRequestAnimationFrame       ||
      window.msRequestAnimationFrame      ||
      function(callback, element) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function() {
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return id;
      };
    return requestAnimationFrame.call(window, callback, element);
  },

  cancelAnimationFrame = function(id) {
    var cancelAnimationFrame =
      window.cancelAnimationFrame ||
      function(id) {
        clearTimeout(id);
      };
    return cancelAnimationFrame.call(window, id);
  };

  return {
    requestAnimationFrame: requestAnimationFrame,
    cancelAnimationFrame: cancelAnimationFrame
  };
})();

SmoothieChart.prototype.addTimeSeries = function(timeSeries, options) {
  this.seriesSet.push({timeSeries: timeSeries, options: options || {}});
};

SmoothieChart.prototype.removeTimeSeries = function(timeSeries) {
  this.seriesSet.splice(this.seriesSet.indexOf(timeSeries), 1);
};

SmoothieChart.prototype.streamTo = function(canvas, delay) {
  this.canvas = canvas;
  this.delay = delay;
  this.start();
};

SmoothieChart.prototype.start = function() {
  if (!this.frame) {
    this.animate();
  }
};

SmoothieChart.prototype.animate = function() {
  this.frame = SmoothieChart.AnimateCompatibility.requestAnimationFrame(this.animate.bind(this));
  this.render(this.canvas, new Date().getTime() - (this.delay || 0));
};

SmoothieChart.prototype.stop = function() {
  if (this.frame) {
    SmootheiChart.AnimateCompatibility.cancelAnimationFrame( this.frame );
    delete this.frame;
  }
};

// Sample timestamp formatting function 
SmoothieChart.timeFormatter = function(dateObject) {
  function pad2(number){return (number < 10 ? '0' : '') + number};
  return pad2(dateObject.getHours())+':'+pad2(dateObject.getMinutes())+':'+pad2(dateObject.getSeconds());
};

SmoothieChart.prototype.render = function(canvas, time) {
  var canvasContext = canvas.getContext("2d");
  var options = this.options;
  var dimensions = {top: 0, left: 0, width: canvas.clientWidth, height: canvas.clientHeight};
  
  // Save the state of the canvas context, any transformations applied in this method
  // will get removed from the stack at the end of this method when .restore() is called.
  canvasContext.save();

  // Round time down to pixel granularity, so motion appears smoother.
  time = time - time % options.millisPerPixel;

  // Move the origin.
  canvasContext.translate(dimensions.left, dimensions.top);
  
  // Create a clipped rectangle - anything we draw will be constrained to this rectangle.
  // This prevents the occasional pixels from curves near the edges overrunning and creating
  // screen cheese (that phrase should need no explanation).
  canvasContext.beginPath();
  canvasContext.rect(0, 0, dimensions.width, dimensions.height);
  canvasContext.clip();

  // Clear the working area.
  canvasContext.save();
  canvasContext.fillStyle = options.grid.fillStyle;
  canvasContext.clearRect(0, 0, dimensions.width, dimensions.height);
  canvasContext.fillRect(0, 0, dimensions.width, dimensions.height);
  canvasContext.restore();

  // Grid lines....
  canvasContext.save();
  canvasContext.lineWidth = options.grid.lineWidth;
  canvasContext.strokeStyle = options.grid.strokeStyle;
  // Vertical (time) dividers.
  if (options.grid.millisPerLine > 0) {
    for (var t = time - (time % options.grid.millisPerLine); t >= time - (dimensions.width * options.millisPerPixel); t -= options.grid.millisPerLine) {
      canvasContext.beginPath();
      var gx = Math.round(dimensions.width - ((time - t) / options.millisPerPixel));
      if (options.grid.sharpLines)
        gx -= 0.5;
      canvasContext.moveTo(gx, 0);
      canvasContext.lineTo(gx, dimensions.height);
      canvasContext.stroke();
      // To display timestamps along the bottom
      // May have to adjust millisPerLine to display non-overlapping timestamps, depending on the canvas size
      if (options.timestampFormatter){
        var tx=new Date(t);
        // Formats the timestamp based on user specified formatting function
        // SmoothieChart.timeFormatter function above is one such formatting option
        var ts = options.timestampFormatter(tx);
        var txtwidth=(canvasContext.measureText(ts).width/2)+canvasContext.measureText(minValueString).width + 4;
        if (gx<dimensions.width - txtwidth){
          canvasContext.fillStyle = options.labels.fillStyle;
          // Insert the time string so it doesn't overlap on the minimum value
          canvasContext.fillText(ts, gx-(canvasContext.measureText(ts).width / 2), dimensions.height-2);
        }
      }    
      canvasContext.closePath();
    }
  }

  // Horizontal (value) dividers.
  for (var v = 1; v < options.grid.verticalSections; v++) {
    var gy = Math.round(v * dimensions.height / options.grid.verticalSections);
    if (options.grid.sharpLines)
      gy -= 0.5;
    canvasContext.beginPath();
    canvasContext.moveTo(0, gy);
    canvasContext.lineTo(dimensions.width, gy);
    canvasContext.stroke();
    canvasContext.closePath();
  }
  // Bounding rectangle.
  canvasContext.beginPath();
  canvasContext.strokeRect(0, 0, dimensions.width, dimensions.height);
  canvasContext.closePath();
  canvasContext.restore();

  // Calculate the current scale of the chart, from all time series.
  var maxValue = Number.NaN;
  var minValue = Number.NaN;

  for (var d = 0; d < this.seriesSet.length; d++) {
      // TODO(ndunn): We could calculate / track these values as they stream in.
      var timeSeries = this.seriesSet[d].timeSeries;
      if (!isNaN(timeSeries.maxValue)) {
          maxValue = !isNaN(maxValue) ? Math.max(maxValue, timeSeries.maxValue) : timeSeries.maxValue;
      }

      if (!isNaN(timeSeries.minValue)) {
          minValue = !isNaN(minValue) ? Math.min(minValue, timeSeries.minValue) : timeSeries.minValue;
      }
  }

  if (isNaN(maxValue) && isNaN(minValue)) {
      canvasContext.restore(); // without this there is crash in Android browser
      return;
  }

  // Scale the maxValue to add padding at the top if required
  if (options.maxValue != null)
    maxValue = options.maxValue;
  else
    maxValue = maxValue * options.maxValueScale;
  // Set the minimum if we've specified one
  if (options.minValue != null)
    minValue = options.minValue;

  // If a custom range function is set, call it
  if (this.yRangeFunction) {
    var range = this.yRangeFunction({min: minValue, max: maxValue});
    minValue = range.min;
    maxValue = range.max;
  }

  var targetValueRange = maxValue - minValue;
  this.currentValueRange += options.scaleSmoothing*(targetValueRange - this.currentValueRange);
  this.currentVisMinValue += options.scaleSmoothing*(minValue - this.currentVisMinValue);
  var valueRange = this.currentValueRange;
  var visMinValue = this.currentVisMinValue;

  var yValueToPixel = function(value)
  {
    var offset = value - visMinValue;
    return dimensions.height - (valueRange !== 0 ? Math.round((offset / valueRange) * dimensions.height) : 0);
  };

  // Draw any horizontal lines
  if (options.horizontalLines && options.horizontalLines.length) {
    for (var hl = 0; hl < options.horizontalLines.length; hl++) {
      var line = options.horizontalLines[hl];
      var hly = Math.round(yValueToPixel(line.value)) - 0.5;
      canvasContext.strokeStyle = line.color || '#ffffff';
      canvasContext.lineWidth = line.lineWidth || 1;
      canvasContext.beginPath();
      canvasContext.moveTo(0, hly);
      canvasContext.lineTo(dimensions.width, hly);
      canvasContext.stroke();
      canvasContext.closePath();
    }
  }

  // For each data set...
  for (var d = 0; d < this.seriesSet.length; d++) {
    canvasContext.save();
    var timeSeries = this.seriesSet[d].timeSeries;
    var dataSet = timeSeries.data;
    var seriesOptions = this.seriesSet[d].options;

    // Delete old data that's moved off the left of the chart.
    // We must always keep the last expired data point as we need this to draw the
    // line that comes into the chart, but any points prior to that can be removed.
    while (dataSet.length >= options.maxDataSetLength && dataSet[1][0] < time - (dimensions.width * options.millisPerPixel)) {
      dataSet.splice(0, 1);
    }

    // Set style for this dataSet.
    canvasContext.lineWidth = seriesOptions.lineWidth || 1;
    canvasContext.strokeStyle = seriesOptions.strokeStyle || '#ffffff';
    // Draw the line...
    canvasContext.beginPath();
    // Retain lastX, lastY for calculating the control points of bezier curves.
    var firstX = 0, lastX = 0, lastY = 0;
    for (var i = 0; i < dataSet.length && dataSet.length !== 1; i++) {
      var x = Math.round(dimensions.width - ((time - dataSet[i][0]) / options.millisPerPixel));
      var y = yValueToPixel(dataSet[i][1]);

      if (i == 0) {
        firstX = x;
        canvasContext.moveTo(x, y);
      }
      // Great explanation of Bezier curves: http://en.wikipedia.org/wiki/Bezier_curve#Quadratic_curves
      //
      // Assuming A was the last point in the line plotted and B is the new point,
      // we draw a curve with control points P and Q as below.
      //
      // A---P
      //     |
      //     |
      //     |
      //     Q---B
      //
      // Importantly, A and P are at the same y coordinate, as are B and Q. This is
      // so adjacent curves appear to flow as one.
      //
      else {
        switch (options.interpolation) {
        case "line":
          canvasContext.lineTo(x,y);
          break;
        case "bezier":
        default:
          canvasContext.bezierCurveTo( // startPoint (A) is implicit from last iteration of loop
            Math.round((lastX + x) / 2), lastY, // controlPoint1 (P)
            Math.round((lastX + x)) / 2, y, // controlPoint2 (Q)
            x, y); // endPoint (B)
          break;
        }
      }

      lastX = x; lastY = y;
    }
    if (dataSet.length > 0 && seriesOptions.fillStyle) {
      // Close up the fill region.
      canvasContext.lineTo(dimensions.width + seriesOptions.lineWidth + 1, lastY);
      canvasContext.lineTo(dimensions.width + seriesOptions.lineWidth + 1, dimensions.height + seriesOptions.lineWidth + 1);
      canvasContext.lineTo(firstX, dimensions.height + seriesOptions.lineWidth);
      canvasContext.fillStyle = seriesOptions.fillStyle;
      canvasContext.fill();
    }
    canvasContext.stroke();
    canvasContext.closePath();
    canvasContext.restore();
  }

  // Draw the axis values on the chart.
  if (!options.labels.disabled) {
      canvasContext.fillStyle = options.labels.fillStyle;
      var maxValueString = parseFloat(maxValue).toFixed(2);
      var minValueString = parseFloat(minValue).toFixed(2);
      canvasContext.fillText(maxValueString, dimensions.width - canvasContext.measureText(maxValueString).width - 2, 10);
      canvasContext.fillText(minValueString, dimensions.width - canvasContext.measureText(minValueString).width - 2, dimensions.height - 2);
  }

  canvasContext.restore(); // See .save() above.
};
