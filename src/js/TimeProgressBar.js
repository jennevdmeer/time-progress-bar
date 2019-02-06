class TimeProgressBar {
    constructor(root, options) {
        this.$container = root;

        this.$bar = undefined;

        this.$progress = undefined;
        this.$progressTick = undefined;
        this.$progressLabel = undefined;

        this.$seperators = undefined;
        this.$labels = undefined;

        this.options = Object.assign({}, {
            progressLabelContent: '__progress__/__total__ (__percentage__%)',
            labelContent: '__count__',
            threshold: 35,
            time: {
                current: 0,
                total: 0
            },
            duration: {
                1: ['second', 'seconds'],
                60: ['minute', 'minutes'],
                3600: ['hour', 'hours'],
            },
            timescale: 1,
            onFinish: undefined,
            onUpdate: undefined
        }, options);

        this._start = this.Now;

        this.initialize();

        TimeProgressBar.register(this);
    }

    static register(instance) {
        if (TimeProgressBar._instances.indexOf(instance) === -1)
            TimeProgressBar._instances.push(instance);

        if (undefined !== TimeProgressBar._interval)
            return;

        TimeProgressBar._interval = setInterval(() => TimeProgressBar.update({ type: 'interval' }), TimeProgressBar.interval);

        window.addEventListener('resize', TimeProgressBar.update);
    }

    static update(e) {
        for (let i = 0; i < TimeProgressBar._instances.length; i++) {
            TimeProgressBar._instances[i].update(e);
        }
    }

    static suspend(instance) {
        let index = TimeProgressBar._instances.indexOf(instance);
        if (index === -1) {
            return;
        }

        TimeProgressBar._instances.splice(index, 1);

        if (!TimeProgressBar._instances.length && TimeProgressBar._interval) {
            clearInterval(TimeProgressBar._interval);
            TimeProgressBar._interval = undefined;

            window.removeEventListener('resize', TimeProgressBar.update);
        }
    }

    get Now() { return new Date() / 1000; }
    get Start() { return this._start; }
    get Total() { return this.options.time.total; }

    get Progress() {
        let elapsed = (this.Now - this.Start) * this.options.timescale;

        return Math.min(this.options.time.current + elapsed, this.Total);
    }

    get Percentage() {
        if (this.Total < 1) {
            return 1;
        }

        return this.Progress / this.Total;
    }

    get LargestDuration() {
        let durations = Object.keys(this.options.duration).reverse();
        for (let key in durations) {
            key = durations[key];

            let count = Math.floor(this.Total / key);
            if (count >= 1) {
                return parseInt(key);
            }
        }

        return 0;
    }

    get Max() { return this.Total / this.LargestDuration; }

    duration(seconds, hideSuffix = false) {
        let durations = Object.keys(this.options.duration).reverse();
        for (let key in durations) {
            key = parseInt(durations[key]);
            if (key < this.LargestDuration && hideSuffix) {
                continue;
            }

            let count = Math.floor(seconds / key);
            if (count >= 1) {
                let suffix = ' ' + this.options.duration[key][Math.abs(count) === 1 ? 0 : 1];

                return count + (hideSuffix ? '': suffix);
            }
        }

        let suffix = this.options.duration[durations[durations.length - 1]][1];
        return '0' + (hideSuffix ? '' : suffix);
    }

    set label(value) {
        this.$progressLabel.innerHTML = value;
    }

    initialize() {
        this.$container.classList.add('time-progress-wrapper');

        this.$bar = document.createElement('div');
        this.$bar.classList.add('time-progress');
        this.$container.appendChild(this.$bar);

        this.$progress = document.createElement('div');
        this.$progress.classList.add('time-progress-bar');
        this.$bar.appendChild(this.$progress);

        this.$progressTick = document.createElement('div');
        this.$progressTick.classList.add('time-progress-bar-tick');
        this.$progress.appendChild(this.$progressTick);

        this.$progressLabel = document.createElement('div');
        this.$progressLabel.classList.add('time-progress-bar-label');
        this.$progress.appendChild(this.$progressLabel);

        this.$seperators = document.createElement('div');
        this.$seperators.classList.add('time-progress-seperators');
        this.$bar.appendChild(this.$seperators);

        this.$labels = document.createElement('div');
        this.$labels.classList.add('time-progress-labels');
        this.$bar.appendChild(this.$labels);

        for (let i = 0; i <= this.Max; i++) {
            this.$seperators.appendChild(this.createSeperator(i));
            this.$labels.appendChild(this.createLabel(i));
        }

        // Initialize first update using our resize event.
        this.update({ type: 'resize' });
    }

    createSeperator(index) {
        let $seperator = document.createElement('div');
        $seperator.classList.add('time-progress-seperator');
        $seperator.style.left = ((1 / this.Max) * index * 100) + '%';

        return $seperator;
    }

    createLabel(index) {
        let $label = document.createElement('div');

        $label.classList.add('time-progress-label');
        $label.style.left = ((1 / this.Max) * index * 100) + '%';
        $label.innerHTML = this.options.labelContent.replace(/__count__/g, index);

        return $label;
    }

    update(e) {
        if (!this.$bar.offsetWidth)
            return;

        this.$progress.style.width = (this.Percentage * 100) + '%';
        this.label = this.options.progressLabelContent
            .replace(/__progress__/g, this.duration(this.Progress, true))
            .replace(/__total__/g, this.duration(this.Total))
            .replace(/__duration__/g, this.duration(this.Total - this.Progress))
            .replace(/__percentage__/g, Math.floor(this.Percentage * 1000) / 10);

        // calculate display changes only on resize.
        if (e.type === 'resize') {
            let currentSegmentCount = this.Max,
                maxSegments = Math.floor(this.$bar.offsetWidth / this.options.threshold),
                activeSegments = Array.prototype.slice.call(this.$labels.children);

            while (currentSegmentCount > maxSegments) {
                currentSegmentCount = currentSegmentCount / 2;
                activeSegments = this.arrayReduce(activeSegments);
            }

            for (let i = 0; i < this.$labels.children.length; i++) {
                let state = activeSegments.indexOf(this.$labels.children[i]) >= 0;

                this.$seperators.children[i].classList.toggle('time-progress-seperator__active', state);
                this.$labels.children[i].classList.toggle('time-progress-label__active', state);
            }
        }

        // Toggle already passed states
        for (let i = 0; i < this.$labels.children.length; i++) {
            let state = this.Percentage * this.Max >= i;

            this.$seperators.children[i].classList.toggle('time-progress-seperator__used', state);
            this.$labels.children[i].classList.toggle('time-progress-label__used', state);
        }

        let onUpdate = this.options.onUpdate;
        if (typeof onUpdate == 'function')
            onUpdate.call(this);

        // Check finished state
        if (this.Progress === this.Total) {
            TimeProgressBar.suspend(this);

            let onFinish = this.options.onFinish;
            if (typeof onFinish === 'function')
                onFinish.call(this);
        }
    }

    arrayReduce(arr) {
        if (!Array.isArray(arr) || (!arr.length)) {
            return [];
        }

        return arr.reduce((result, value, index) => {
            if (!(index % 2)) {
                result.push(value);
            }

            return result;
        }, []);
    }
}

TimeProgressBar._instances = [];
TimeProgressBar._interval = undefined;

TimeProgressBar.interval = 250;

export default TimeProgressBar;
