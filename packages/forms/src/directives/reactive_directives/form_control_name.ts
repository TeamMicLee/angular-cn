/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Directive, EventEmitter, Host, Inject, Input, OnChanges, OnDestroy, Optional, Output, Self, SimpleChanges, SkipSelf, forwardRef} from '@angular/core';

import {FormControl} from '../../model';
import {NG_ASYNC_VALIDATORS, NG_VALIDATORS} from '../../validators';
import {AbstractFormGroupDirective} from '../abstract_form_group_directive';
import {ControlContainer} from '../control_container';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '../control_value_accessor';
import {NgControl} from '../ng_control';
import {ReactiveErrors} from '../reactive_errors';
import {_ngModelWarning, composeAsyncValidators, composeValidators, controlPath, isPropertyUpdated, selectValueAccessor} from '../shared';
import {AsyncValidator, AsyncValidatorFn, Validator, ValidatorFn} from '../validators';

import {NG_MODEL_WITH_FORM_CONTROL_WARNING} from './form_control_directive';
import {FormGroupDirective} from './form_group_directive';
import {FormArrayName, FormGroupName} from './form_group_name';

export const controlNameBinding: any = {
  provide: NgControl,
  useExisting: forwardRef(() => FormControlName)
};

/**
 * @description
 * Syncs a `FormControl` in an existing `FormGroup` to a form control
 * element by name.
 *
 * 根据名字将现有 `FormGroup` 中的 `FormControl` 与一个表单控件进行同步。
 *
 * @see [Reactive Forms Guide](guide/reactive-forms)
 * @see `FormControl`
 * @see `AbstractControl`
 *
 * @usageNotes
 *
 * ### Register `FormControl` within a group
 *
 * ### 把 `FormControl` 注册进一个组
 *
 * The following example shows how to register multiple form controls within a form group
 * and set their value.
 *
 * 下面的例子演示了如何把多个表单控件注册进一个表单组，并设置它们的值。
 *
 * {@example forms/ts/simpleFormGroup/simple_form_group_example.ts region='Component'}
 *
 * To see `formControlName` examples with different form control types, see:
 *
 * 要查看把 `formControlName` 应用于不同类型的表单控件的例子，参见：
 *
 * * Radio buttons: `RadioControlValueAccessor`
 *
 *   单选按钮: `RadioControlValueAccessor`
 *
 * * Selects: `SelectControlValueAccessor`
 *
 *   单选下拉框: `SelectControlValueAccessor`
 *
 * ### Use with ngModel
 *
 * ### 和 ngModel 一起使用
 *
 * Support for using the `ngModel` input property and `ngModelChange` event with reactive
 * form directives has been deprecated in Angular v6 and will be removed in Angular v7.
 *
 * 从 Angular v6 开始，已经废弃了在响应式表单中使用输入属性 `ngModel` 和事件 `ngModelChange` 的方式，并将在 Angular v7 中移除。
 *
 * Now deprecated:
 *
 * 现已废弃：
 *
 * ```html
 * <form [formGroup]="form">
 *   <input formControlName="first" [(ngModel)]="value">
 * </form>
 * ```
 *
 * ```ts
 * this.value = 'some value';
 * ```
 *
 * This has been deprecated for a few reasons. First, developers have found this pattern
 * confusing. It seems like the actual `ngModel` directive is being used, but in fact it's
 * an input/output property named `ngModel` on the reactive form directive that simply
 * approximates (some of) its behavior. Specifically, it allows getting/setting the value
 * and intercepting value events. However, some of `ngModel`'s other features - like
 * delaying updates with`ngModelOptions` or exporting the directive - simply don't work,
 * which has understandably caused some confusion.
 *
 * 它被废弃有几个理由。
 * 首先，一些开发者觉得这种用法让人困惑。它看起来好像是在使用 `ngModel` 指令，
 * 但实际上它只是响应式表单指令上的一个名叫 `ngModel` 的输入/输出属性，只是在行为上和 `ngModel` 指令有点相似而已。
 * 特别是，它运行获取 / 设置控件值，并拦截值变更事件。
 * 不过，不支持 `ngModel` 的某些其它特性 - 比如不能用 `ngModelOptions` 进行延迟修改，也不能导出该指令，
 * 如果没有理解这一点，就会带来一些困惑。
 *
 * In addition, this pattern mixes template-driven and reactive forms strategies, which
 * we generally don't recommend because it doesn't take advantage of the full benefits of
 * either strategy. Setting the value in the template violates the template-agnostic
 * principles behind reactive forms, whereas adding a `FormControl`/`FormGroup` layer in
 * the class removes the convenience of defining forms in the template.
 *
 * 此外，该模式混用了模板驱动表单和响应式表单的策略，我们通常不建议这么实用，因为它无法同时得到这两种策略的全部优点。
 * 在模板中设置值，违背了响应式表单背后的 "模板无关性" 设计原则；而在类中增加 `FormControl`/`FormGroup` 层次则破坏了在模板中定义表单带来的便利性。
 *
 *
 * To update your code before v7, you'll want to decide whether to stick with reactive form
 * directives (and get/set values using reactive forms patterns) or switch over to
 * template-driven directives.
 *
 * 要在 Angular v7 之前修改你的现有代码，就要决定是钉死在响应式表单指令（并通过响应式表单模式来获取/设置值）或切换到那些模板驱动表单的指令。
 *
 * After (choice 1 - use reactive forms):
 *
 * 以后的写法（选择 1 - 使用响应式表单）：
 *
 * ```html
 * <form [formGroup]="form">
 *   <input formControlName="first">
 * </form>
 * ```
 *
 * ```ts
 * this.form.get('first').setValue('some value');
 * ```
 *
 * After (choice 2 - use template-driven forms):
 *
 * 以后的写法（选择 2 - 使用模板驱动表单）：
 *
 * ```html
 * <input [(ngModel)]="value">
 * ```
 *
 * ```ts
 * this.value = 'some value';
 * ```
 *
 * By default, when you use this pattern, you will see a deprecation warning once in dev
 * mode. You can choose to silence this warning by providing a config for
 * `ReactiveFormsModule` at import time:
 *
 * 默认情况下，当你使用此模式时，你会在开发模式下看到一个废弃（deprecation）警告。
 * 你可以在导入 `ReactiveFormsModule` 时提供一个配置项来消除这个警告：
 *
 * ```ts
 * imports: [
 *   ReactiveFormsModule.withConfig({warnOnNgModelWithFormControl: 'never'})
 * ]
 * ```
 *
 * Alternatively, you can choose to surface a separate warning for each instance of this
 * pattern with a config value of `"always"`. This may help to track down where in the code
 * the pattern is being used as the code is being updated.
 *
 * 或者，你也可以选择指定一个配置值 `"always"` 来为每个符合这种模式的实例都单独显示一个警告。
 * 这会帮助你在修改代码时追踪代码中用到这种模式的所有位置。
 *
 * @ngModule ReactiveFormsModule
 * @publicApi
 */
@Directive({selector: '[formControlName]', providers: [controlNameBinding]})
export class FormControlName extends NgControl implements OnChanges, OnDestroy {
  private _added = false;
  /**
   * @description
   * Internal reference to the view model value.
   * @internal
   */
  viewModel: any;

  /**
   * @description
   * Tracks the `FormControl` instance bound to the directive.
   */
  // TODO(issue/24571): remove '!'.
  readonly control !: FormControl;

  /**
   * @description
   * Tracks the name of the `FormControl` bound to the directive. The name corresponds
   * to a key in the parent `FormGroup` or `FormArray`.
   */
  // TODO(issue/24571): remove '!'.
  @Input('formControlName') name !: string;

  /**
   * @description
   * Triggers a warning that this input should not be used with reactive forms.
   */
  @Input('disabled')
  set isDisabled(isDisabled: boolean) { ReactiveErrors.disabledAttrWarning(); }

  // TODO(kara): remove next 4 properties once deprecation period is over

  /** @deprecated as of v6 */
  @Input('ngModel') model: any;

  /** @deprecated as of v6 */
  @Output('ngModelChange') update = new EventEmitter();

  /**
   * @description
   * Static property used to track whether any ngModel warnings have been sent across
   * all instances of FormControlName. Used to support warning config of "once".
   *
   * 静态属性，用于跟踪是否曾在所有的 `FormControlName` 实例中发出过这种 ngModel 警告。用于支持警告选项 `"once"`。
   *
   * @internal
   */
  static _ngModelWarningSentOnce = false;

  /**
   * @description
   * Instance property used to track whether an ngModel warning has been sent out for this
   * particular FormControlName instance. Used to support warning config of "always".
   *
   * 实例属性，用于跟踪是否曾在特定的 `FormControlName` 实例中发出过这种 ngModel 警告。用于支持警告选项 `"always"`
   * @internal
   */
  _ngModelWarningSent = false;

  constructor(
      @Optional() @Host() @SkipSelf() parent: ControlContainer,
      @Optional() @Self() @Inject(NG_VALIDATORS) validators: Array<Validator|ValidatorFn>,
      @Optional() @Self() @Inject(NG_ASYNC_VALIDATORS) asyncValidators:
          Array<AsyncValidator|AsyncValidatorFn>,
      @Optional() @Self() @Inject(NG_VALUE_ACCESSOR) valueAccessors: ControlValueAccessor[],
      @Optional() @Inject(NG_MODEL_WITH_FORM_CONTROL_WARNING) private _ngModelWarningConfig: string|
      null) {
    super();
    this._parent = parent;
    this._rawValidators = validators || [];
    this._rawAsyncValidators = asyncValidators || [];
    this.valueAccessor = selectValueAccessor(this, valueAccessors);
  }

  /**
   * @description
   * A lifecycle method called when the directive's inputs change. For internal use only.
   *
   * @param changes A object of key/value pairs for the set of changed inputs.
   */
  ngOnChanges(changes: SimpleChanges) {
    if (!this._added) this._setUpControl();
    if (isPropertyUpdated(changes, this.viewModel)) {
      _ngModelWarning('formControlName', FormControlName, this, this._ngModelWarningConfig);
      this.viewModel = this.model;
      this.formDirective.updateModel(this, this.model);
    }
  }

  /**
   * @description
   * Lifecycle method called before the directive's instance is destroyed. For internal use only.
   */
  ngOnDestroy(): void {
    if (this.formDirective) {
      this.formDirective.removeControl(this);
    }
  }

  /**
   * @description
   * Sets the new value for the view model and emits an `ngModelChange` event.
   *
   * @param newValue The new value for the view model.
   */
  viewToModelUpdate(newValue: any): void {
    this.viewModel = newValue;
    this.update.emit(newValue);
  }

  /**
   * @description
   * Returns an array that represents the path from the top-level form to this control.
   * Each index is the string name of the control on that level.
   */
  get path(): string[] { return controlPath(this.name, this._parent !); }

  /**
   * @description
   * The top-level directive for this group if present, otherwise null.
   */
  get formDirective(): any { return this._parent ? this._parent.formDirective : null; }

  /**
   * @description
   * Synchronous validator function composed of all the synchronous validators
   * registered with this directive.
   */
  get validator(): ValidatorFn|null { return composeValidators(this._rawValidators); }

  /**
   * @description
   * Async validator function composed of all the async validators registered with this
   * directive.
   */
  get asyncValidator(): AsyncValidatorFn {
    return composeAsyncValidators(this._rawAsyncValidators) !;
  }

  private _checkParentType(): void {
    if (!(this._parent instanceof FormGroupName) &&
        this._parent instanceof AbstractFormGroupDirective) {
      ReactiveErrors.ngModelGroupException();
    } else if (
        !(this._parent instanceof FormGroupName) && !(this._parent instanceof FormGroupDirective) &&
        !(this._parent instanceof FormArrayName)) {
      ReactiveErrors.controlParentException();
    }
  }

  private _setUpControl() {
    this._checkParentType();
    (this as{control: FormControl}).control = this.formDirective.addControl(this);
    if (this.control.disabled && this.valueAccessor !.setDisabledState) {
      this.valueAccessor !.setDisabledState !(true);
    }
    this._added = true;
  }
}
